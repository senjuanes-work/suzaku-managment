let elMinInOrdinaryCheck = document.getElementById("minInOrdinaryCheck");
let elMinInOrdinaryInput = document.getElementById("minInOrdinaryInput");
let elMinInSpecialCheck = document.getElementById("minInSpecialCheck");
let elMinInSpecialInput = document.getElementById("minInSpecialInput");

let elMinBreakOrdinaryCheck = document.getElementById("minBreakOrdinaryCheck");
let elMinBreakOrdinaryInput = document.getElementById("minBreakOrdinaryInput");
let elMinBreakSpecialCheck = document.getElementById("minBreakSpecialCheck");
let elMinBreakSpecialInput = document.getElementById("minBreakSpecialInput");

let elHoursWorkOrdinaryInput = document.getElementById("hoursWorkOrdinaryInput");
let elHoursWorkSpecialInput = document.getElementById("hoursWorkSpecialInput");

let elPrecisionModeCheck = document.getElementById("precisionModeCheck");

let configuration;

load();

function load() {
    chrome.storage.sync.get(
        [
            "precisionMode",
            "minInOrdinaryEnable",
            "minInSpecialEnable",
            "minInOrdinary",
            "minInSpecial",
            "minBreakOrdinaryEnable",
            "minBreakSpecialEnable",
            "minBreakOrdinary",
            "minBreakSpecial",
            "hoursWorkOrdinary",
            "hoursWorkSpecial"
        ], (configurationStore) => {
        configuration = configurationStore;
        
        configuration.minInOrdinary = configuration.minInOrdinary ?  configuration.minInOrdinary : '08:30';
        configuration.minInSpecial = configuration.minInSpecial ?  configuration.minInSpecial : '08:00';

        configuration.minBreakOrdinary = isValidNumber(configuration.minBreakOrdinary) ?  Number(configuration.minBreakOrdinary) : 0.5 * 60 * 60 * 1000;
        configuration.minBreakSpecial = isValidNumber(configuration.minBreakSpecial) ?  Number(configuration.minBreakSpecial) : 0 * 60 * 60 * 1000;

        configuration.hoursWorkOrdinary = isValidNumber(configuration.hoursWorkOrdinary) ?  Number(configuration.hoursWorkOrdinary) : 8.5 * 60 * 60 * 1000;
        configuration.hoursWorkSpecial = isValidNumber(configuration.hoursWorkSpecial) ?  Number(configuration.hoursWorkSpecial) : 7 * 60 * 60 * 1000;

        fillFields();
    });
}

function fillFields() {
    console.log('Configuration', configuration);

    elMinInOrdinaryCheck.checked = !!configuration.minInOrdinaryEnable;
    elMinInSpecialCheck.checked = !!configuration.minInSpecialEnable;

    elMinBreakOrdinaryCheck.checked = !!configuration.minBreakOrdinaryEnable;
    elMinBreakSpecialCheck.checked = !!configuration.minBreakSpecialEnable;

    elPrecisionModeCheck.checked = !!configuration.precisionMode;


    elMinInOrdinaryInput.disabled = !configuration.minInOrdinaryEnable;
    elMinInSpecialInput.disabled = !configuration.minInSpecialEnable;

    elMinBreakOrdinaryInput.disabled = !configuration.minBreakOrdinaryEnable;
    elMinBreakSpecialInput.disabled = !configuration.minBreakSpecialEnable;

    elMinInOrdinaryInput.value = configuration.minInOrdinary;
    elMinInSpecialInput.value = configuration.minInSpecial;

    elMinBreakOrdinaryInput.value = configuration.minBreakOrdinary / 1000 / 60;
    elMinBreakSpecialInput.value = configuration.minBreakSpecial / 1000 / 60;

    elHoursWorkOrdinaryInput.value = configuration.hoursWorkOrdinary / 1000 / 60 / 60;
    elHoursWorkSpecialInput.value = configuration.hoursWorkSpecial / 1000 / 60 / 60;
}

function isValidNumber(item) {
    return item !== undefined && item !== null && Number(item) !== NaN;
}

/* EVENT LISTENERS */
elMinInOrdinaryCheck.addEventListener("change", (event) => {
    configuration.minInOrdinaryEnable = !!event.target.checked;
    chrome.storage.sync.set(configuration);
    fillFields();
});

elMinInSpecialCheck.addEventListener("change", (event) => {
    configuration.minInSpecialEnable = !!event.target.checked;
    chrome.storage.sync.set(configuration);
    fillFields();
});

elMinBreakOrdinaryCheck.addEventListener("change", (event) => {
    configuration.minBreakOrdinaryEnable = !!event.target.checked;
    chrome.storage.sync.set(configuration);
    fillFields();
});

elMinBreakSpecialCheck.addEventListener("change", (event) => {
    configuration.minBreakSpecialEnable = !!event.target.checked;
    chrome.storage.sync.set(configuration);
    fillFields();
});

elMinInOrdinaryInput.addEventListener("change", (event) => {
    configuration.minInOrdinary = event.target.value;
    chrome.storage.sync.set(configuration);
    fillFields();
});

elMinInSpecialInput.addEventListener("change", (event) => {
    configuration.minInSpecial = event.target.value;
    chrome.storage.sync.set(configuration);
    fillFields();
});

elMinBreakOrdinaryInput.addEventListener("change", (event) => {
    configuration.minBreakOrdinary = event.target.value * 60 * 1000;
    chrome.storage.sync.set(configuration);
    fillFields();
});

elMinBreakSpecialInput.addEventListener("change", (event) => {
    configuration.minBreakSpecial = event.target.value * 60 * 1000;
    chrome.storage.sync.set(configuration);
    fillFields();
});

elPrecisionModeCheck.addEventListener("change", (event) => {
    configuration.precisionMode = !!event.target.checked;
    chrome.storage.sync.set(configuration);
    fillFields();
});

elHoursWorkOrdinaryInput.addEventListener("change", (event) => {
    configuration.hoursWorkOrdinary = event.target.value * 60 * 60 * 1000;
    chrome.storage.sync.set(configuration);
    fillFields();
});

elHoursWorkSpecialInput.addEventListener("change", (event) => {
    configuration.hoursWorkSpecial = event.target.value * 60 * 60 * 1000;
    chrome.storage.sync.set(configuration);
    fillFields();
});