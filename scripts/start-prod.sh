#!/bin/bash

##################################################
# Script for (re)starting production environment #
##################################################

# $1 - (optional) --use-version - use specific version (only supported for versions >=0.8.13.10)
# $1 - (optional) --dev/-d - run in development
# $1 - (optional) --restart - skip apt update and DB dump

# $2 - (optional, required if $1 = --use-version) version
# $2 - (optional) --cleanup - only used when $1 = --dev/-d

restart_containers() {
  # Remove all images that contain "denimint"
  echo -e "\nRemoving old images...\n"
  sudo docker images | grep cubingcontests | tr -s ' ' | cut -d ' ' -f 3 | xargs -tI % sudo docker rmi % --force

  sudo docker compose -f docker-compose-prod.yml up -d
}

set_version_in_env() {
  mv .env .env.bak
  sudo bash -c "sed -E \"s/export VERSION=[^ #]*/export VERSION=$1/\" .env.bak > .env"
  sudo rm .env.bak
}

if [ "$1" == "--use-version" ]; then

  #### USE OLDER VERSION ####

  # Check that a version argument was passed
  if [ -z "$2" ]; then
    echo "Please provide a version as the first argument"
    exit
  else
    # If it was, make sure a tag for that version exists
    VERSION=$(git tag | grep -x "^$2$")
    
    if [ -z "$VERSION" ]; then
      echo "Version tag $2 does not exist"
      exit
    fi
  fi

  echo "Reverting to version $VERSION (press ENTER to continue...)"
  read

  ./scripts/dump-db.sh /dump

  # Stop Docker containers
  sudo docker compose -f docker-compose-prod.yml down &&

  # Revert to previous version
  git reset --hard $VERSION &&
  set_version_in_env $VERSION

  restart_containers

elif [ "$1" != "--dev" ] && [ "$1" != "-d" ]; then

  #### PRODUCTION ####

  if [ "$1" != "--restart" ]; then  
    sudo apt update &&
    sudo apt dist-upgrade

    ./scripts/dump-db.sh /dump
  fi

  # Stop Docker containers
  sudo docker compose -f docker-compose-prod.yml down &&

  # Pull from Github
  echo -e "Pulling from Github...\n"
  git pull

  # Set the VERSION variable back to latest, in case it was set to an older version
  set_version_in_env latest

  restart_containers

else #### DEVELOPMENT ####

  # Stop Docker containers
  docker compose -f docker-compose-prod-dev.yml down &&
  docker compose down &&

  # Remove all images that contain "denimint"
  echo -e "\nRemoving old images\n"
  docker images | grep cubingcontests | tr -s ' ' | cut -d ' ' -f 3 | xargs -tI % docker rmi % --force

  if [ "$2" != "--cleanup" ]; then
    # Build frontend and API containers
    docker build --build-arg API_BASE_URL=http://localhost:5000/api -t cubingcontests-client --file client.Dockerfile . &&
    docker build -t cubingcontests-api --file server.Dockerfile . &&

    docker compose -f docker-compose-prod-dev.yml up
  fi

fi
