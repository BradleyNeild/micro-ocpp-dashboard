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

    const [fetchingEvse, setFetchingEvse] = useState(false);
    const [fetchingMeter, setFetchingMeter] = useState(false);

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
                                <a href="#" class={`status-attr is-border-radius all-center is-shadow-1 interact ${evPlugged?`active ${_currentColor()}`:""}`} onClick={()=>{setEvPlugged(!evPlugged)}}>
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
                                <a href="#" class={`status-attr is-border-radius all-center is-shadow-1 interact ${evReady?`active ${_currentColor()}`:""}`} onClick={()=>{setEvReady(!evReady)}}>
                                    <div class="fix-height">
                                        <IEv />
                                    </div>
                                    <div>
                                        {evReady?"Ready":"Not Ready"}
                                    </div>
                                </a>
                                <a href="#" class={`status-attr is-border-radius all-center is-shadow-1 interact ${evseReady?`active ${_currentColor()}`:""}`} onClick={()=>{setEvseReady(!evseReady)}}>
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
            </div>
        </div>
    </div>
}