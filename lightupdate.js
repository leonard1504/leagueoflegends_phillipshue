const fetch = require('cross-fetch');
const axios = require('axios');
const { username, bridgeIP, summonername, lampsnumber } = require('./config.json');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
let teamCHAOS = [];
let teamORDER = [];
let isTeamORDER;
let isTeamCHAOS;
let friendly;

const delay = ms => new Promise(res => setTimeout(res, ms));

//-===========================================-
// init sets everything to default and 
// starts the functions getTeams and getEvents
//-===========================================-
async function init() {
    try {
        isTeamORDER = false;
        isTeamCHAOS = false;
        getTeams();
        getEvents(0);
    } catch(e) {
        if(e.code === 'ECONNREFUSED') {
            init();
        }
    }
}

//-========================================-
// getTeams gets the summonernames and puts
// them in one of the two teams
//-========================================-
async function getTeams() {
    try {
        players = await fetch('https://127.0.0.1:2999/liveclientdata/playerlist').then(res => res.json());
        if(players.httpStatus === 404) {
            getTeams();
        } else {
            for(let startIndex = 0; players.length > startIndex; startIndex++) {
                switch(players[startIndex].team) {
                    case "ORDER": 
                        teamORDER.push(players[startIndex].summonerName);
                        break;
                    case "CHAOS": 
                        teamCHAOS.push(players[startIndex].summonerName);
                        break;
                }
            }
            if(teamCHAOS.length > 0 && teamORDER.length > 0) {
                console.log(`Team Chaos: \n`);
                console.log(teamCHAOS);
                console.log("-===========================-");
                console.log(`Team Order: \n`);
                console.log(teamORDER);
                if(teamORDER.some(summoner => summoner === `${summonername}`)) {
                    isTeamORDER = true;
                } else {
                    isTeamCHAOS = true;
                }
            } else {
                getTeams();
            }
        }
    } catch(e) {
        if(e.code === 'ECONNREFUSED') {
            getTeams();
        } else {
            console.log(e);
        }
    }
}

//-=======================================-
// getEvents collects the newest event and
// executes the fitting light function
//-=======================================-
async function getEvents(startIndex) {
    try {
        events = await fetch('https://127.0.0.1:2999/liveclientdata/eventdata').then(res => res.json());
        if(events.Events.length === startIndex) {
            getEvents(events.Events.length)
        } else {
            let eventType = events.Events[startIndex].EventName;
            console.log(eventType);
            switch(eventType) {
                case "TurretKilled":
                    console.log(`${events.Events[startIndex].KillerName} hat einen Turm zerstört`);
                    checkTeam(events.Events[startIndex].KillerName);
                    lightsKill(friendly);
                    break;
                case "FirstBrick":
                    console.log(`${events.Events[startIndex].KillerName} hat den ersten Turm zerstört`);
                    checkTeam(events.Events[startIndex].KillerName);
                    lightsKill(friendly);
                    break;
                case "InhibKilled":
                    console.log(`${events.Events[startIndex].KillerName} hat einen Inhib zerstört`);
                    checkTeam(events.Events[startIndex].KillerName);
                    lightsKill(friendly);
                    break;
                case "DragonKill":
                    console.log(events.Events[startIndex].DragonType);
                    switch(events.Events[startIndex].DragonType) {
                        case "Elder":
                            console.log(`${events.Events[startIndex].KillerName} hat den Elder Drachen getötet`);
                            lightsElderD();
                            break;
                        case "Earth":
                            console.log(`${events.Events[startIndex].KillerName} hat den Erd Drachen getötet`);
                            lightsEarthD();
                            break;
                        case "Air":
                            console.log(`${events.Events[startIndex].KillerName} hat den Wolken Drachen getötet`);
                            lightsAirD();
                            break;
                        case "Fire":
                            console.log(`${events.Events[startIndex].KillerName} hat den Feuer Drachen getötet`);
                            lightsFireD();
                            break;
                        case "Water":
                            console.log(`${events.Events[startIndex].KillerName} hat den Ozean Drachen getötet`);
                            lightsWaterD();
                            break;
                        case "Chemtech":
                            console.log(`${events.Events[startIndex].KillerName} hat den Chemtech Drachen getötet`);
                            lightsChemD();
                            break;
                        case "Hextech":
                            console.log(`${events.Events[startIndex].KillerName} hat den Hextech Drachen getötet`);
                            lightsHexD();
                            break;
                    }
                    break;
                case "BaronKill":
                    console.log(`${events.Events[startIndex].KillerName} hat den Baron getötet`);
                    lightsBaron_Herald();
                    break;
                case "HeraldKill":
                    console.log(`${events.Events[startIndex].KillerName} hat den Herald gefangen`);
                    lightsBaron_Herald();
                    break;
                case "ChampionKill":
                    console.log(`${events.Events[startIndex].KillerName} hat ${events.Events[startIndex].VictimName} getötet`);
                    if(events.Events[(startIndex)+1].EventName === "FirstBlood") {
                        checkTeam(events.Events[(startIndex)+1].Recipient);
                        lightsKill(friendly);
                    } else if (events.Events[(startIndex)+1].EventName === "Ace"){
                        checkTeam(events.Events[(startIndex)+1].Acer);
                        lightsAce(friendly);
                    } else {
                        checkTeam(events.Events[startIndex].KillerName);
                        lightsKill(friendly);
                    }
                    break;
                case "GameEnd":
                    if(events.Events[startIndex].Result === "Win") {
                        lightsAce(true);
                    } else {
                        lightsAce(false);
                    }
                    await delay(10000);
                    init();
                    break;  
                default:
                    break;
            }
            getEvents(events.Events.length);
        }
    } catch(e) {
        getEvents(0);
    }
}

//-===========================================-
// checkTeam checks if the friendly team or
// the enemy team has made a kill, tower, etc.
//-===========================================-
function checkTeam(killerName) {
    if(teamORDER.some(summoner => summoner === `${killerName}`)) {
        if(isTeamORDER) {
            friendly = true;
        } else {
            friendly = false;
        }
    } else if(teamCHAOS.some(summoner => summoner === `${killerName}`)) {
        if(isTeamCHAOS) {
            friendly = true;
        } else {
            friendly = false;
        }
    }
}

//-=================================================-
// setColor sets the color of the phillips hue lamps
//-=================================================-
async function setColor(on, hue, sat, bri) {
    try {
        for(let i = 1; lampsnumber >= i; i++) {
            await axios.put(`http://${bridgeIP}/api/${username}/lights/${i}/state`, 
                {on,
                    ...(hue && { hue }),
                    ...(sat && { sat }),
                    ...(bri && { bri }),
                }
            );
            console.log(`Lamp Nr. ${i} has the following values now H: ${hue} S: ${sat} L: ${bri}`); 
        }
    } catch (err) {
        console.error(err);
    }
}

//-===========================================-
// lightsKill, lightsAce, etc. sets the colors
// for the events happening ingame
//-===========================================-
async function lightsKill(friendly) {
    if(friendly === true) {
        setColor(true, 122, 53, 62);
        await delay(800);
        setColor(true, 39385,13,254);
        await delay(800);
        setColor(true, 122, 53, 62);
        await delay(800);
        setColor(true, 39385,13,254);
    } else {
        setColor(true, 0, 89, 28);
        await delay(800);
        setColor(true, 39385,13,254);
        await delay(800);
        setColor(true, 0, 89, 28);
        await delay(800);
        setColor(true, 39385,13,254);
    }
}

async function lightsAce(friendly) {
    if(friendly === true) {
        setColor(true, 122, 53, 62);
        await delay(800);
        setColor(true, 122, 53, 82);
        await delay(800);
        setColor(true, 122, 53, 62);
        await delay(800);
        setColor(true, 39385,13,254);
    } else {
        setColor(true, 0, 89, 28);
        await delay(800);
        setColor(true, 0, 89, 46);
        await delay(800);
        setColor(true, 0, 89, 28);
        await delay(800);
        setColor(true, 39385,13,254);
    }
}

async function lightsFireD() {
    setColor(true, 38, 96, 62);
    await delay(800);
    setColor(true, 38, 96, 36);
    await delay(800);
    setColor(true, 38, 96, 18);
    await delay(800);
    setColor(true, 39385,13,254);
}

async function lightsEarthD() {
    setColor(true, 33, 46, 36);
    await delay(800);
    setColor(true, 38, 96, 30);
    await delay(800);
    setColor(true, 38, 96, 22);
    await delay(800);
    setColor(true, 39385,13,254);
}

async function lightsAirD() {
    setColor(true, 171, 42, 80);
    await delay(800);
    setColor(true, 171, 42, 50);
    await delay(800);
    setColor(true, 171, 42, 30);
    await delay(800);
    setColor(true, 39385,13,254);
}

async function lightsWaterD() {
    setColor(true, 187, 92, 45);
    await delay(800);
    setColor(true, 187, 92, 30);
    await delay(800);
    setColor(true, 187, 92, 15);
    await delay(800);
    setColor(true, 39385,13,254);
}

async function lightsHexD() {
    setColor(true, 221, 100, 82);
    await delay(800);
    setColor(true, 221, 100, 60);
    await delay(800);
    setColor(true, 221, 100, 38);
    await delay(800);
    setColor(true, 39385,13,254);
}

async function lightsChemD() {
    setColor(true, 89, 100, 27);
    await delay(800);
    setColor(true, 89, 100, 19);
    await delay(800);
    setColor(true, 89, 100, 10);
    await delay(800);
    setColor(true, 39385,13,254);
}

async function lightsElderD() {
    setColor(true, 177, 90, 59);
    await delay(800);
    setColor(true, 177, 90, 37);
    await delay(800);
    setColor(true, 177, 90, 24);
    await delay(800);
    setColor(true, 39385,13,254);
}

async function lightsBaron_Herald() {
    setColor(true, 268, 73, 41);
    await delay(800);
    setColor(true, 268, 73, 31);
    await delay(800);
    setColor(true, 268, 73, 21);
    await delay(800);
    setColor(true, 39385,13,254);
}

init();
