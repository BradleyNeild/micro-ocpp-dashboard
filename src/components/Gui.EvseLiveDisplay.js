import { Fragment, h } from "preact";

import "./component_styles/evseLiveDisplay.css";

import { useEffect, useState } from "preact/hooks";
import DataService from "../DataService";

import ICross from "./icons/ICross.svg";
import ICheckCircle from "./icons/ICheckCircle.svg";
import IClock from "./icons/IClock.svg";
import ICirclePlus from "./icons/ICirclePlus.svg";
import IForbidden from "./icons/IForbidden.svg";
import IPlugged from "./icons/IPlugged.svg";
import IUnplugged from "./icons/IUnplugged.svg";
import IEv from "./icons/IEv.svg";
import IEvseIcon from "./icons/IEvseIcon.svg";
import ILiveArrows from "./icons/ILiveArrows.svg";

export default function EvseLiveDisplay(props) {

    const fetchIntervalMs = 1000;

    const [evseError, setEvseError] = useState("");
    const [meterError, setMeterError] = useState("");

    const [idTag, setIdTag] = useState("");
    const [rfidError, setRfidError] = useState("");

    const [fetchingEvse, setFetchingEvse] = useState(false);
    const [fetchingMeter, setFetchingMeter] = useState(false);

    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState("");
    const [postSuccess, setPostSuccess] = useState("");

    const [evPlugged, setEvPlugged] = useState(false);
    const [evReady, setEvReady] = useState(false);
    const [evseReady, setEvseReady] = useState(false);
    const [chargePointStatus, setChargePointStatus] = useState("Faulted");

    const [energy, setEnergy] = useState(-1);
    const [power, setPower] = useState(-1);
    const [current, setCurrent] = useState(-1);
    const [voltage, setVoltage] = useState(-1);

    useEffect(()=>{
        fetchEvse();
    },[evPlugged, evReady, evseReady]);

    useEffect(()=>{
        let interval = setInterval(()=>{
            fetchMeter();
            fetchEvse();
        }, fetchIntervalMs);
        return ()=>{
            clearInterval(interval);
        }
    });

    function fetchEvse(){
        if(fetchingEvse) return;
        setFetchingEvse(true);
        DataService.get("/connector/" + props.connectorId + "/evse").then(
            resp => {
                setEvseError("");
                setEvPlugged(resp.evPlugged);
                setEvReady(resp.evReady);
                setEvseReady(resp.evseReady);
                setChargePointStatus(resp.chargePointStatus)
            }
        ).catch(
            e => {
                setEvseError("Evse Network Error");
            }
        ).finally(
            ()=>{
                setFetchingEvse(false);
            }
        )
    }

    function updateEvse(_evPlugged, _evReady, _evseReady) {
        setEvPlugged(_evPlugged);
        setEvReady(_evReady);
        setEvseReady(_evseReady);
        if (posting) return;
        setPosting(true);
        DataService.post("/connector/" + props.connectorId + "/evse", {
            evPlugged: _evPlugged,
            evReady: _evReady,
            evseReady: _evseReady
        }).then(
            resp => {
                if (
                    resp.evPlugged === evPlugged &&
                    resp.evReady === evReady &&
                    resp.evseReady === evseReady
                ) {
                    setPostSuccess(`Evse update confirmed by the server - ${DateFormatter.fullDate(new Date())}`);
                    setPostError("");
                } else {
                    setPostSuccess("");
                    setPostError("Error while confirming update - You should re-fetch the evse");
                }
            }
        ).catch(
            e => {
                setPostSuccess("");
                setPostError("Unable to fetch evse");
            }
        ).finally(
            () => {
                setPosting(false);
            }
        )
    }

    function fetchMeter(){
        if(fetchingMeter) return;
        setFetchingMeter(true);
        DataService.get("/connector/" + props.connectorId + "/meter").then(
            resp => {
                setMeterError("");
                setEnergy(resp.energy);
                setPower(resp.power);
                setCurrent(resp.current);
                setVoltage(resp.voltage);
            }
        ).catch(
            e => {
                setMeterError("Meter Network Error");
            }
        ).finally(
            ()=>{
                setFetchingMeter(false);
            }
        )
    }

    function _currentColor(){
        switch (chargePointStatus) {
            case "Available":
            case "Preparing":
                return "green";
            case "Charging":
            case "SuspendedEV":
                return "blue";
            default:
                return "red";
        }
    }
    function _currentGradient(){
        switch (chargePointStatus) {
            case "Available":
            case "Preparing":
                return "bg-gradient-green";
            case "Charging":
            case "SuspendedEV":
                return "bg-gradient-blue";
            default:
                return "bg-gradient-red";
        }
    }

    function _StatusBadge() {
        function icon(){
            switch (chargePointStatus) {
                case "Available":
                    return <ICheckCircle />
                case "Preparing":
                    return <IClock />
                case "Charging":
                case "SuspendedEV":
                    return <ICirclePlus />
                default:
                    return <IForbidden />
            }
        }
        
        return <div class={`status-badge ${_currentColor()}`} onClick={()=>{setChargePointStatus("Charging")}}>
            <div class="upper all-center">
                {
                    icon()
                }
            </div>
            <div class="lower all-center">
            {chargePointStatus}
            </div>
        </div>
    }

    function handleIdTagChange(e) {
        setIdTag(e.target.value);
    }

    function handleRfidSubmit(e) {
        e.preventDefault();
        if (idTag.trim() === "") {
            setRfidError("RFID tag cannot be empty");
            return;
        }
        if (idTag.length > 20) {
            setRfidError("RFID tag must be 20 characters or less");
            return;
        }
        setRfidError("");
        simulateRfidSwipe(idTag.trim());
    }

    function simulateRfidSwipe(tag) {
        setPosting(true);
        DataService.post("/connector/" + props.connectorId + "/transaction", {
            idTag: tag
        }).then(
            resp => {
                setPostSuccess(`RFID tag ${tag} processed successfully - ${DateFormatter.fullDate(new Date())}`);
                setPostError("");
                setIdTag("");  // Clear the input field after successful submission
            }
        ).catch(
            e => {
                setPostSuccess("");
                setPostError("Error processing RFID tag");
            }
        ).finally(
            () => {
                setPosting(false);
            }
        )
    }

    return <div class={`evse-live is-padded-16 is-border-radius is-shadow-1 ${_currentGradient()}`}>
        <div class="is-row">
            <div class="is-col" style="flex-grow:0">
                {_StatusBadge()}
            </div>
            <div class="is-col">
                <div class="is-row">
                    <div class={`is-col`}>
                        <div class="is-row">
                            <div class="is-col">
                                <h3>
                                    <span>
                                        Connector {props.connectorId}
                                    </span>
                                    <span class="is-outset-x-8 label is-tertiary">
                                        {
                                            evseError !== "" &&
                                            <Fragment>
                                                <ICross />
                                                {evseError}
                                            </Fragment>
                                        }
                                        {
                                            evseError === "" && meterError !== "" &&
                                            <Fragment>
                                                <ICross />
                                                {meterError}
                                            </Fragment>
                                        }
                                        {
                                            evseError === "" && meterError === "" &&
                                            <Fragment>
                                                <ILiveArrows class="live-rotate" />
                                                Live
                                            </Fragment>
                                        }
                                    </span>
                                </h3>
                            </div>
                        </div>
                        <div class="is-row">
                            <div class="is-col evse-attr">
                                <a href="#" class={`status-attr is-border-radius all-center is-shadow-1 interact ${evPlugged?`active ${_currentColor()}`:""}`} onClick={()=>{updateEvse(!evPlugged, evReady, evseReady);}}>
                                    {
                                        !evPlugged && <IUnplugged />
                                    }
                                    {
                                        evPlugged && <IPlugged />
                                    }
                                    <div>
                                        {evPlugged?"Plugged":"Unplugged"}
                                    </div>
                                </a>
                                <a href="#" class={`status-attr is-border-radius all-center is-shadow-1 interact ${evReady?`active ${_currentColor()}`:""}`} onClick={()=>{updateEvse(evPlugged, !evReady, evseReady);}}>
                                    <div class="fix-height">
                                        <IEv />
                                    </div>
                                    <div>
                                        {evReady?"Ready":"Not Ready"}
                                    </div>
                                </a>
                                <a href="#" class={`status-attr is-border-radius all-center is-shadow-1 interact ${evseReady?`active ${_currentColor()}`:""}`} onClick={()=>{updateEvse(evPlugged, evReady, !evseReady);}}>
                                    <IEvseIcon />
                                    <div>
                                        {evseReady?"Ready":"Not Ready"}
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="is-col meter-values">
                        <div class="label all-center">
                            Energy<br/>
                            {energy} Wh
                        </div>
                        <div class="label all-center">
                            Power<br/>
                            {power} W

                        </div>
                        <div class="label all-center">
                            Current<br/>
                            {current} A

                        </div>
                        <div class="label all-center">
                            Voltage<br/>
                            {voltage} V
                        </div>
                    </div>
                </div>
                <div class="is-row">
                    <div class="is-col">
                        <form onSubmit={handleRfidSubmit} class="rfid-reader">
                            <input
                                type="text"
                                value={idTag}
                                onInput={handleIdTagChange}
                                placeholder="Enter RFID tag (max 20 chars)"
                                maxLength={20}
                                class="rfid-input"
                            />
                            <button type="submit" disabled={posting} class="rfid-submit">
                                {posting ? "Processing..." : "Swipe RFID"}
                            </button>
                        </form>
                        {postSuccess && <p class="success-message">{postSuccess}</p>}
                        {postError && <p class="error-message">{postError}</p>}
                    </div>
                </div>
            </div>
        </div>
    </div>
}