"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { addHours } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { debounce } from "lodash";
import { useFetchWcaCompDetails, useMyFetch } from "~/helpers/customHooks.ts";
import {
  ICompetitionDetails,
  IContestData,
  IContestDto,
  IContestEvent,
  IEvent,
  IFePerson,
  IMeetupDetails,
  IRoom,
  type IRound,
  NumberInputValue,
} from "~/shared_helpers/types.ts";
import { Color, ContestState, ContestType } from "~/shared_helpers/enums.ts";
import { getDateOnly, getIsCompType } from "~/shared_helpers/sharedFunctions.ts";
import { contestTypeOptions } from "~/helpers/multipleChoiceOptions.ts";
import { getContestIdFromName, getTimeLimit, getUserInfo } from "~/helpers/utilityFunctions.ts";
import C from "~/shared_helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import Form from "~/app/components/form/Form.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import FormCountrySelect from "~/app/components/form/FormCountrySelect.tsx";
import FormRadio from "~/app/components/form/FormRadio.tsx";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import FormNumberInput from "~/app/components/form/FormNumberInput.tsx";
import FormTextArea from "~/app/components/form/FormTextArea.tsx";
import FormDatetimeInput from "~/app/components/form/FormDatetimeInput.tsx";
import Tabs from "~/app/components/UI/Tabs.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import Button from "~/app/components/UI/Button.tsx";
import CreatorDetails from "~/app/components/CreatorDetails.tsx";
import ContestEvents from "./ContestEvents.tsx";
import ScheduleEditor from "./ScheduleEditor.tsx";
import WcaCompAdditionalDetails from "~/app/components/WcaCompAdditionalDetails.tsx";
import type { InputPerson } from "~/helpers/types.ts";

const userInfo = getUserInfo();

const ContestForm = ({
  events,
  contestData,
  mode,
}: {
  events: IEvent[];
  contestData?: IContestData;
  mode: "new" | "edit" | "copy";
}) => {
  const myFetch = useMyFetch();
  const fetchWcaCompDetails = useFetchWcaCompDetails();
  const {
    changeErrorMessages,
    changeSuccessMessage,
    loadingId,
    changeLoadingId,
    resetMessagesAndLoadingId,
  } = useContext(MainContext);

  const [activeTab, setActiveTab] = useState("details");
  const [detailsImported, setDetailsImported] = useState(
    mode === "edit" && contestData?.contest.type === ContestType.WcaComp,
  );
  const [queueEnabled, setQueueEnabled] = useState(false);

  const [competitionId, setCompetitionId] = useState("");
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [type, setType] = useState(ContestType.Meetup);
  const [city, setCity] = useState("");
  const [countryIso2, setCountryIso2] = useState("NOT_SELECTED");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(0); // vertical coordinate (Y); ranges from -90 to 90
  const [longitude, setLongitude] = useState(0); // horizontal coordinate (X); ranges from -180 to 180
  const [startDate, setStartDate] = useState(getDateOnly(new Date()));
  const [startTime, setStartTime] = useState(addHours(getDateOnly(new Date()) as Date, 12)); // meetup-only; set 12:00 as initial start time
  const [endDate, setEndDate] = useState(new Date());
  const [organizerNames, setOrganizerNames] = useState<string[]>([""]);
  const [organizers, setOrganizers] = useState<InputPerson[]>([null]);
  const [contact, setContact] = useState("");
  const [description, setDescription] = useState("");
  const [competitorLimit, setCompetitorLimit] = useState<NumberInputValue>();

  // Event stuff
  const [contestEvents, setContestEvents] = useState<IContestEvent[]>([]);

  // Schedule stuff
  const [venueTimeZone, setVenueTimeZone] = useState("GMT"); // e.g. Europe/Berlin
  const [rooms, setRooms] = useState<IRoom[]>([]);

  const tabs = [
    { title: "Details", value: "details" },
    { title: "Events", value: "events" },
    { title: "Schedule", value: "schedule", hidden: !getIsCompType(type) },
  ];
  const disableIfContestApproved: boolean = mode === "edit" && !!contestData &&
    contestData.contest.state >= ContestState.Approved;
  const disableIfContestPublished: boolean = mode === "edit" && !!contestData &&
    contestData.contest.state >= ContestState.Published;
  const disableIfDetailsImported = !userInfo?.isAdmin && detailsImported;

  const updateTimeZoneAndAdjustTimes = useCallback(
    debounce(async (latitude: number, longitude: number) => {
      const { payload, errors } = await myFetch.get(
        `/timezone?latitude=${latitude}&longitude=${longitude}`,
        { authorize: true, loadingId: null },
      );

      if (errors) {
        changeErrorMessages(["Error while fetching the time zone. Please reload and try again."]);
      } else {
        setVenueTimeZone(payload.timezone);

        if (type === ContestType.Meetup) {
          setStartTime(fromZonedTime(toZonedTime(startTime, venueTimeZone), payload.timeZone));
        } else if (getIsCompType(type)) {
          setRooms(
            rooms.map((r: IRoom) => ({
              ...r,
              activities: r.activities.map((a) => ({
                ...a,
                startTime: fromZonedTime(toZonedTime(a.startTime, venueTimeZone), payload.timeZone),
                endTime: fromZonedTime(toZonedTime(a.endTime, venueTimeZone), payload.timeZone),
              })),
            })),
          );
        }
        changeLoadingId("");
      }
    }, C.fetchDebounceTimeout),
    [venueTimeZone],
  );

  //////////////////////////////////////////////////////////////////////////////
  // Use effect
  //////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (mode !== "new") {
      const { contest } = contestData as IContestData;

      setCompetitionId(contest.competitionId);
      setName(contest.name);
      setShortName(contest.shortName);
      setType(contest.type);
      if (contest.city) setCity(contest.city);
      setCountryIso2(contest.countryIso2);
      if (contest.venue) setVenue(contest.venue);
      if (contest.address) setAddress(contest.address);
      if (contest.latitudeMicrodegrees && contest.longitudeMicrodegrees) {
        setLatitude(contest.latitudeMicrodegrees / 1000000);
        setLongitude(contest.longitudeMicrodegrees / 1000000);
      }
      setOrganizerNames([...contest.organizers.map((el) => el.name), ""]);
      setOrganizers([...contest.organizers, null]);
      if (contest.contact) setContact(contest.contact);
      if (contest.description) setDescription(contest.description);
      if (contest.competitorLimit) setCompetitorLimit(contest.competitorLimit);
      // Convert the dates from string to Date
      setStartDate(new Date(contest.startDate));

      if (getIsCompType(contest.type)) {
        setEndDate(new Date(contest.endDate as Date));

        if (contest.compDetails) {
          const venue = contest.compDetails.schedule.venues[0];
          setRooms(venue.rooms);
          setVenueTimeZone(venue.timezone);
          // This was necessary for imported comps in the past, because they had compDetails as undefined immediately after import.
          // Commenting this out, cause the import feature is currently disabled. Feel free to remove this in the future if it's no
          // longer needed for importing comps.
          // } else {
          //   fetchTimeZone(contest.latitudeMicrodegrees / 1000000, contest.longitudeMicrodegrees / 1000000).then((tz) => setDefaultActivityTimes(tz));
        }
      } else {
        setStartTime(new Date((contest.meetupDetails as IMeetupDetails).startTime));
        setVenueTimeZone(contest.timezone);
      }

      if (mode === "copy") {
        const contestEventsWithoutRoundIdsOrResults = contest.events.map((
          ce,
        ) => ({
          ...ce,
          rounds: ce.rounds.map((r) => ({ ...r, _id: undefined, results: [] })),
        }));
        setContestEvents(contestEventsWithoutRoundIdsOrResults);
      } else if (mode === "edit") {
        setContestEvents(contest.events);
        if (contest.queuePosition) setQueueEnabled(true);
      }
    }
  }, [contestData, events]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    const isCompType = getIsCompType(type);
    if (!startDate || (isCompType && !endDate) || (!isCompType && !startTime)) {
      changeErrorMessages(["Please enter valid dates"]);
      return;
    } else if (typeof latitude !== "number" || typeof longitude !== "number") {
      changeErrorMessages(["Please enter valid coordinates"]);
      return;
    }

    changeLoadingId("form_submit_button");

    const selectedOrganizers = organizers.filter((o: InputPerson) => o !== null);
    const latitudeMicrodegrees = Math.round(latitude * 1000000);
    const longitudeMicrodegrees = Math.round(longitude * 1000000);

    // Set the contest ID for every round and empty results if there were any
    // in order to avoid sending too much data to the backend
    const processedCompEvents = contestEvents.map((ce: IContestEvent) => ({
      ...ce,
      rounds: ce.rounds.map((round) => ({ ...round, competitionId, results: [] })),
    }));

    let compDetails: ICompetitionDetails | undefined;
    let meetupDetails: IMeetupDetails | undefined;

    if (getIsCompType(type)) {
      compDetails = {
        schedule: {
          competitionId,
          venues: [
            {
              id: 1,
              name: venue || "Unknown venue",
              countryIso2,
              latitudeMicrodegrees,
              longitudeMicrodegrees,
              timezone: "TEMPORARY", // this is set on the backend
              // Only send the rooms that have at least one activity
              rooms: rooms.filter((r: IRoom) => r.activities.length > 0),
            },
          ],
        },
      };
    } else {
      meetupDetails = { startTime };
    }

    const newComp: IContestDto = {
      competitionId,
      name: name.trim(),
      shortName: shortName.trim(),
      type,
      city: city.trim(),
      countryIso2,
      venue: venue.trim(),
      address: address.trim(),
      latitudeMicrodegrees,
      longitudeMicrodegrees,
      startDate,
      endDate: getIsCompType(type) ? endDate : undefined,
      organizers: selectedOrganizers,
      contact: contact.trim() || undefined,
      description: description.trim() || undefined,
      competitorLimit: competitorLimit || undefined,
      events: processedCompEvents,
      compDetails,
      meetupDetails,
    };

    const getRoundWithDefaultTimeLimitExists = () =>
      processedCompEvents.some((ce: IContestEvent) =>
        ce.rounds.some((r) => r.timeLimit?.centiseconds === 60000 && r.timeLimit?.cumulativeRoundIds.length === 0)
      );
    const doSubmit = mode === "edit" || // this check isn't needed when editing a contest
      !getRoundWithDefaultTimeLimitExists() ||
      confirm(`
You have a round with a default time limit of 10:00. A round with a high time limit may take too long. Are you sure you would like to keep this time limit?
`);

    if (doSubmit) {
      // Validation
      const tempErrors: string[] = [];

      if (selectedOrganizers.length < organizerNames.filter((on: string) => on !== "").length) {
        tempErrors.push("Please enter all organizers");
      }

      if (type === ContestType.WcaComp && !detailsImported) {
        tempErrors.push('You must use the "Get WCA competition details" feature');
      }

      if (tempErrors.length > 0) {
        changeErrorMessages(tempErrors);
      } else {
        const { errors } = mode === "edit"
          ? await myFetch.patch(`/competitions/${(contestData as IContestData).contest.competitionId}`, newComp, {
            loadingId: null,
          })
          : await myFetch.post("/competitions", newComp, { loadingId: null });

        if (errors) changeErrorMessages(errors);
        else window.location.href = "/mod";
      }
    } else {
      changeLoadingId("");
    }
  };

  const fillWithMockData = async (
    mockContestType = ContestType.Competition,
  ) => {
    const { payload, errors } = await myFetch.get<IFePerson>(
      `/persons?personId=${userInfo?.personId}`,
      { loadingId: "set_mock_comp_button" },
    );

    if (payload && !errors) {
      setType(mockContestType);
      setCity("Singapore");
      setCountryIso2("SG");
      setAddress("Address");
      setVenue("Venue");
      setLatitude(1.314663);
      setLongitude(103.845409);
      setOrganizerNames([payload.name]);
      setOrganizers([payload]);
      setContact(`${userInfo?.username}@cc.com`);
      setDescription("THIS IS A MOCK CONTEST!");
      setCompetitorLimit(100);

      if (mockContestType === ContestType.Meetup) {
        setName("New Meetup 2024");
        setShortName("New Meetup 2024");
        setCompetitionId("NewMeetup2024");
      } else {
        setName("New Competition 2024");
        setShortName("New Competition 2024");
        setCompetitionId("NewCompetition2024");
        setVenueTimeZone("Asia/Singapore");
        setRooms([{ id: 1, name: "Main", color: Color.White, activities: [] }]);
      }
    }
  };

  const changeActiveTab = (newTab: string) => {
    if (
      newTab === "schedule" &&
      (typeof latitude !== "number" || typeof longitude !== "number")
    ) {
      changeErrorMessages(["Please enter valid coordinates first"]);
    } else {
      setActiveTab(newTab);

      if (newTab === "events") {
        // If the rounds that are supposed to have time limits don't have them
        // (this can be true for old contests), set them to empty time limits
        setContestEvents(
          contestEvents.map((ce: IContestEvent) => ({
            ...ce,
            rounds: ce.rounds.map((r: IRound) => ({ ...r, timeLimit: r.timeLimit ?? getTimeLimit(ce.event.format) })),
          })),
        );
      }
    }
  };

  const changeName = (value: string) => {
    // If not editing a competition, update Competition ID accordingly, unless it deviates from the name
    if (mode !== "edit") {
      if (competitionId === getContestIdFromName(name)) {
        setCompetitionId(getContestIdFromName(value));
      }
      if (shortName === name && value.length <= 32) setShortName(value);
    }

    setName(value);
  };

  const changeShortName = (value: string) => {
    // Only update the value if the new one is within the allowed limit, or if it's shorter than it was (e.g. when Backspace is pressed)
    if (value.length <= 32 || value.length < shortName.length) {
      setShortName(value);
    }
  };

  const getWcaCompDetails = async () => {
    if (!competitionId) {
      changeErrorMessages(["Please enter a contest ID"]);
      return;
    }

    try {
      changeLoadingId("get_wca_comp_details_button");
      const newContest = await fetchWcaCompDetails(competitionId);

      const latitude = Number((newContest.latitudeMicrodegrees / 1000000).toFixed(6));
      const longitude = Number((newContest.longitudeMicrodegrees / 1000000).toFixed(6));

      setName(newContest.name);
      setShortName(newContest.shortName);
      setCity(newContest.city);
      setCountryIso2(newContest.countryIso2);
      setAddress(newContest.address);
      setVenue(newContest.venue);
      setLatitude(latitude);
      setLongitude(longitude);
      setStartDate(newContest.startDate);
      setEndDate(newContest.endDate);
      setOrganizers([...newContest.organizers, null]);
      setOrganizerNames([...newContest.organizers.map((o) => o.name), ""]);
      setDescription(newContest.description);
      setCompetitorLimit(newContest.competitorLimit);

      await changeCoordinates(latitude, longitude);

      setDetailsImported(true);
      resetMessagesAndLoadingId();
    } catch (err: any) {
      if (err.message.includes("Not found")) {
        changeErrorMessages([
          `Competition with ID ${competitionId} not found. This may be because it's not been enough time since it was announced. If so, please try again in 24 hours.`,
        ]);
      } else changeErrorMessages([err.message]);
    }
  };

  const changeCoordinates = (newLat: number, newLong: number) => {
    if (typeof newLat === "number" || typeof newLong === "number") {
      setLatitude(newLat);
      setLongitude(newLong);
    } else {
      const processedLatitude = Math.min(Math.max(newLat, -90), 90);
      const processedLongitude = Math.min(Math.max(newLong, -180), 180);

      setLatitude(processedLatitude);
      setLongitude(processedLongitude);

      changeLoadingId("TIMEZONE_UPDATE");
      updateTimeZoneAndAdjustTimes(processedLatitude, processedLongitude);
    }
  };

  const changeStartDate = (newDate: Date) => {
    if (!getIsCompType(type)) {
      setStartTime(newDate);
      setStartDate(getDateOnly(toZonedTime(newDate, venueTimeZone)));
    } else {
      setStartDate(newDate);

      if (newDate.getTime() > endDate.getTime()) setEndDate(newDate);
    }
  };

  const cloneContest = () => {
    changeLoadingId("clone_contest_button");
    window.location.href = `/mod/competition?copy_id=${(contestData as IContestData).contest.competitionId}`;
  };

  const removeContest = async () => {
    const answer = confirm(
      `Are you sure you would like to remove ${(contestData as IContestData).contest.name}?`,
    );

    if (answer) {
      const { errors } = await myFetch.delete(
        `/competitions/${competitionId}`,
        { loadingId: "delete_contest_button", keepLoadingAfterSuccess: true },
      );

      if (!errors) window.location.href = "/mod";
    }
  };

  const downloadScorecards = async () => {
    await myFetch.get(`/scorecards/${(contestData as IContestData).contest.competitionId}`, {
      authorize: true,
      fileName: `${(contestData as IContestData).contest.competitionId}_Scorecards.pdf`,
      loadingId: "download_scorecards_button",
    });
  };

  const enableQueue = async () => {
    const { errors } = await myFetch.patch(
      `/competitions/enable-queue/${(contestData as IContestData).contest.competitionId}`,
      {},
      { loadingId: "enable_queue_button" },
    );

    if (!errors) setQueueEnabled(true);
  };

  const createAuthToken = async () => {
    const { payload, errors } = await myFetch.get(
      `/create-auth-token/${(contestData as IContestData).contest.competitionId}`,
      { authorize: true, loadingId: "get_access_token_button" },
    );

    if (!errors) changeSuccessMessage(`Your new access token is ${payload}`);
  };

  return (
    <div>
      <Form
        buttonText={mode === "edit" ? "Save Contest" : "Create Contest"}
        onSubmit={handleSubmit}
        disableButton={disableIfContestPublished}
      >
        {userInfo?.isAdmin && mode === "edit" && contestData?.creator && (
          <CreatorDetails creator={contestData.creator} />
        )}

        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={changeActiveTab}
        />

        {activeTab === "details" && (
          <>
            {process.env.NODE_ENV !== "production" &&
              mode === "new" && (
              <div className="d-flex gap-3 mt-3 mb-4">
                <Button
                  id="set_mock_comp_button"
                  onClick={() => fillWithMockData()}
                  disabled={detailsImported}
                  className="btn-secondary"
                >
                  Set Mock Competition
                </Button>
                <Button
                  onClick={() => fillWithMockData(ContestType.Meetup)}
                  disabled={detailsImported}
                  className="btn-secondary"
                >
                  Set Mock Meetup
                </Button>
              </div>
            )}
            {mode === "edit" && contestData && (
              <div className="d-flex flex-wrap gap-3 mt-3 mb-4">
                {contestData.contest.type !== ContestType.WcaComp && (
                  // This has to be done like this, because redirection using <Link/> breaks the clone contest feature
                  <Button
                    id="clone_contest_button"
                    onClick={cloneContest}
                    loadingId={loadingId}
                  >
                    Clone
                  </Button>
                )}
                {userInfo?.isAdmin && (
                  <Button
                    id="delete_contest_button"
                    onClick={removeContest}
                    loadingId={loadingId}
                    disabled={contestData.contest.participants > 0}
                    className="btn-danger"
                  >
                    Remove Contest
                  </Button>
                )}
                <Button
                  id="download_scorecards_button"
                  onClick={downloadScorecards}
                  loadingId={loadingId}
                  disabled={contestData.contest.state < ContestState.Approved}
                  className="btn-success"
                >
                  Scorecards
                </Button>
                <Button
                  id="enable_queue_button"
                  onClick={enableQueue}
                  loadingId={loadingId}
                  disabled={contestData.contest.state < ContestState.Approved ||
                    contestData.contest.state >= ContestState.Finished ||
                    queueEnabled}
                  className="btn-secondary"
                >
                  {queueEnabled ? "Queue Enabled" : "Enable Queue"}
                </Button>
                <Button
                  id="get_access_token_button"
                  onClick={createAuthToken}
                  loadingId={loadingId}
                  disabled={contestData.contest.state < ContestState.Approved ||
                    contestData.contest.state >= ContestState.Finished}
                  className="btn-secondary"
                >
                  Get Access Token
                </Button>
              </div>
            )}
            <FormTextInput
              title="Contest name"
              value={name}
              setValue={changeName}
              autoFocus
              disabled={disableIfDetailsImported}
            />
            <FormTextInput
              title="Short name"
              value={shortName}
              setValue={changeShortName}
              disabled={disableIfDetailsImported}
            />
            <FormTextInput
              title="Contest ID"
              value={competitionId}
              setValue={setCompetitionId}
              disabled={mode === "edit" || disableIfDetailsImported}
            />
            <FormRadio
              title="Type"
              options={contestTypeOptions.filter((ct) => !ct.disabled)}
              selected={type}
              setSelected={setType}
              disabled={mode !== "new" || disableIfDetailsImported}
            />
            {type === ContestType.WcaComp && mode === "new" && (
              <Button
                id="get_wca_comp_details_button"
                onClick={getWcaCompDetails}
                loadingId={loadingId}
                className="mb-3"
                disabled={disableIfDetailsImported}
              >
                Get WCA competition details
              </Button>
            )}
            <div className="row">
              <div className="col">
                <FormTextInput
                  title="City"
                  value={city}
                  setValue={setCity}
                  disabled={disableIfDetailsImported}
                />
              </div>
              <div className="col">
                <FormCountrySelect
                  countryIso2={countryIso2}
                  setCountryIso2={setCountryIso2}
                  disabled={mode === "edit" || disableIfDetailsImported}
                />
              </div>
            </div>
            <FormTextInput
              title="Address"
              value={address}
              setValue={setAddress}
              disabled={disableIfDetailsImported}
            />
            <div className="row">
              <div className="col-12 col-md-6">
                <FormTextInput
                  title="Venue"
                  value={venue}
                  setValue={setVenue}
                  disabled={disableIfDetailsImported}
                />
              </div>
              <div className="col-12 col-md-6">
                <div className="row">
                  <div className="col-6">
                    <FormNumberInput
                      title="Latitude"
                      value={latitude}
                      setValue={(val) => changeCoordinates(val, longitude)}
                      disabled={disableIfContestApproved || disableIfDetailsImported}
                      min={-90}
                      max={90}
                    />
                  </div>
                  <div className="col-6">
                    <FormNumberInput
                      title="Longitude"
                      value={longitude}
                      setValue={(val) => changeCoordinates(latitude, val)}
                      disabled={disableIfContestApproved || disableIfDetailsImported}
                      min={-180}
                      max={180}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="text-secondary fs-6 mb-2">
                    Time zone: {loadingId === "TIMEZONE_UPDATE" ? <Loading small dontCenter /> : venueTimeZone}
                  </div>
                  <div className="text-danger fs-6">
                    The coordinates must point to a building and match the address of the venue.
                  </div>
                </div>
              </div>
            </div>
            <div className="my-3 row">
              <div className="col">
                {!getIsCompType(type)
                  ? (
                    <FormDatetimeInput
                      id="start_date"
                      title={`Start date and time (${
                        type === ContestType.Meetup ? (loadingId === "TIMEZONE_UPDATE" ? "..." : venueTimeZone) : "UTC"
                      })`}
                      value={startTime}
                      setValue={changeStartDate}
                      timeZone={type === ContestType.Meetup ? venueTimeZone : "UTC"}
                      dateFormat="Pp"
                      disabled={disableIfContestApproved || disableIfDetailsImported}
                      showUTCTime
                    />
                  )
                  : (
                    <FormDatetimeInput
                      id="start_date"
                      title="Start date"
                      value={startDate}
                      setValue={changeStartDate}
                      dateFormat="P"
                      disabled={disableIfContestApproved || disableIfDetailsImported}
                    />
                  )}
              </div>
              {getIsCompType(type) && (
                <div className="col">
                  <FormDatetimeInput
                    id="end_date"
                    title="End date"
                    value={endDate}
                    setValue={setEndDate}
                    disabled={disableIfContestApproved || disableIfDetailsImported}
                  />
                </div>
              )}
            </div>
            <h5>Organizers</h5>
            <div className="my-3 pt-3 px-4 border rounded bg-body-tertiary">
              <FormPersonInputs
                title="Organizer"
                personNames={organizerNames}
                setPersonNames={setOrganizerNames}
                persons={organizers}
                setPersons={setOrganizers}
                infiniteInputs
                nextFocusTargetId="contact"
                disabled={disableIfContestApproved && !userInfo?.isAdmin}
                addNewPersonFromNewTab
              />
            </div>
            <FormTextInput
              id="contact"
              title="Contact (optional)"
              placeholder="john@example.com"
              value={contact}
              setValue={setContact}
              disabled={disableIfContestPublished}
            />
            <FormTextArea
              title="Description (optional)"
              value={description}
              setValue={setDescription}
              disabled={disableIfContestPublished}
            />
            {type === ContestType.WcaComp && (
              <div>
                <p className="fs-6">
                  The description must be available in English for WCA competitions. You may still include versions
                  written in other languages, and the order doesn't matter.
                </p>
                <p className="fs-6 fst-italic">
                  The following text will be displayed above the description on the contest page:
                </p>
                <div className="mx-2">
                  <WcaCompAdditionalDetails name={name || "[CONTEST NAME]"} competitionId={competitionId} />
                </div>
              </div>
            )}
            <FormNumberInput
              title={"Competitor limit" + (!getIsCompType(type) ? " (optional)" : "")}
              value={competitorLimit}
              setValue={setCompetitorLimit}
              disabled={(disableIfContestApproved && !userInfo?.isAdmin) || disableIfDetailsImported}
              integer
              min={C.minCompetitorLimit}
            />
          </>
        )}

        {activeTab === "events" && (
          <ContestEvents
            events={events}
            contestEvents={contestEvents}
            setContestEvents={setContestEvents}
            contestType={type}
            disableNewEvents={!userInfo?.isAdmin && disableIfContestApproved && type !== ContestType.Meetup}
          />
        )}

        {activeTab === "schedule" && (
          <ScheduleEditor
            rooms={rooms}
            setRooms={setRooms}
            venueTimeZone={venueTimeZone}
            startDate={startDate}
            contestType={type}
            contestEvents={contestEvents}
            disabled={disableIfContestPublished}
          />
        )}
      </Form>
    </div>
  );
};

export default ContestForm;
