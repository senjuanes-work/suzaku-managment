let elTable = document.getElementById("table");
let elInfoBox = document.getElementById("infoBox");
let elWorkedHours = document.getElementById("workedHours");
let elHoursToWork = document.getElementById("hoursToWork");
let elOutRow = document.getElementById("outRow");
let elOutTime = document.getElementById("outTime");
let elPercentaje = document.getElementById("percentaje");


let now = new Date();

let isSpecialDay = now.getDay() === 5 || now.getMonth() === 6 || now.getMonth() === 7;

let msTotalWorkToday = (isSpecialDay ? 7 : 8.5) * 60 * 60 * 1000;

let configuration = {
    precisionMode: false,
    minInOrdinaryEnable: false,
    minInSpecialEnable: false,
    minInOrdinary: null,
    minInSpecial: null,
    minBreakOrdinaryEnable: false,
    minBreakSpecialEnable: false,
    minBreakOrdinary: null,
    minBreakSpecial: null,
};

let responseData;

load();

function load() {
    chrome.storage.sync.get([
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

        if ((isValidNumber(configuration.hoursWorkSpecial) && isSpecialDay) || (isValidNumber(configuration.hoursWorkOrdinary) && !isSpecialDay)) {
            msTotalWorkToday = isSpecialDay ? Number(configuration.hoursWorkSpecial) : Number(configuration.hoursWorkOrdinary);
        }
        
        var formData = new FormData();
        formData.append('StartDate',new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
        formData.append('EndDate', new Date(new Date().setHours(23, 59, 59, 0)).toISOString());
        // formData.append('UserId', 'CF21EDB4-F39D-4260-82BF-535327E40716'); Quiza en algun caso haya que filtrar por UserId
        
        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'https://nervia.suzaku.es/Hr/Attendance/List_Read', true);
        xhr.send(formData);
        
        xhr.onreadystatechange = function () {
            try {
                if (this.readyState != 4) return;
                
                if (this.status == 200) {
                    responseData = JSON.parse(this.responseText);
                
                    fillTable();
                
                    window.setInterval(function () {
                        fillTable();
                    }, 1000);
                } else {
                    elInfoBox.innerHTML = 'Error al conectar';
                    fillTable();
                }
            } catch (error) {
                elInfoBox.innerHTML = 'Error al conectar';
                    fillTable();
            }
        };
    });
}

function fillTable() {
    ins = [];
    outs = [];
    msCount = 0;

    if (responseData && responseData.data) {
        responseData.data.Items.forEach(item => {
            if (item.AttendanceType === 'In') ins.push(new Date(item.UserDate).getTime());
            if (item.AttendanceType === 'Out') outs.push(new Date(item.UserDate).getTime());
        });

        // outs.push(Date.now() - 45 * 60 * 1000); // Crear una salida ficticia hace 45 min
        // ins.push(Date.now() - 15 * 60 * 1000); // Crear una entrada ficticia hace 15 min
    }

    if (ins.length === outs.length)  {
        elInfoBox.style.display = 'inline-block';

        if (outs.length > 0) {
            outs.sort();
            
            if (configuration.precisionMode) {
                hoursPause = round2((Date.now() - outs[0])/1000/60/60, 4);
            } else {
                hoursPause = toHumanReadable(Date.now() - outs[0]);
            }

            elInfoBox.innerHTML = 'En pausa: ' + hoursPause;
        } else {
            elInfoBox.innerHTML = 'En pausa';
        }
    }

    ins.sort();
    outs.sort();

    try {
        if(configuration.minInOrdinaryEnable && !isSpecialDay && ins.length > 0) {
            let minDate = new Date();
            minDate.setHours(configuration.minInOrdinary.split(':')[0]);
            minDate.setMinutes(configuration.minInOrdinary.split(':')[1]);
            minDate.setSeconds(0);
            minDate.setMilliseconds(0);
            if (minDate.getTime() && ins[0] < minDate.getTime()) {
                ins[0] = minDate.getTime();
            }
        }
        
        if(configuration.minInSpecialEnable && isSpecialDay && ins.length > 0) {
            let minDate = new Date();
            minDate.setHours(configuration.minInSpecial.split(':')[0]);
            minDate.setMinutes(configuration.minInSpecial.split(':')[1]);
            if (minDate.getTime() && ins[0] < minDate.getTime()) {
                ins[0] = minDate.getTime();
            }
        }
    } catch (error) {
        console.error('Error en la configuración de entrada mínima', error)
    }

    let msInOffice = 0; // Milisegundos totales desde el la primera entrada y la ultima salida o hora actual
    let msInBreak = 0; // Milisegundos totales de descanso
    let msTotalPrevisionInBreak = 0; // Milisegundos totales de descanso o los previstos si es mayor

    if(ins.length > outs.length) {
        msInOffice = Date.now() - ins[0];
    } else if (ins.length > 0) {
        msInOffice = outs[outs.length - 1] - ins[0];
    }


    for (let i = 0; i < outs.length; i++) {
        msInBreak += ((ins[i+1]) ? (ins[i+1]) : Date.now()) - outs[i];
        msTotalPrevisionInBreak = msInBreak;
    }

    if(isSpecialDay && configuration.minBreakSpecialEnable && isValidNumber(configuration.minBreakSpecial) && Number(configuration.minBreakSpecial) > msInBreak) {
        msTotalPrevisionInBreak = Number(configuration.minBreakSpecial);
    }

    if(!isSpecialDay && configuration.minBreakOrdinaryEnable && isValidNumber(configuration.minBreakOrdinary) && Number(configuration.minBreakOrdinary) > msInBreak) {
        msTotalPrevisionInBreak = Number(configuration.minBreakOrdinary);
    }

    let msWorked = (msInOffice - msInBreak); // Milisegundos del tiempo trabajado

    if (
        isSpecialDay || 
        ins.length > 1 || 
        (configuration.minBreakOrdinaryEnable && isValidNumber(configuration.minBreakOrdinary))
    ) {
        elOutRow.style.display = 'table-row';
    }

    let msRemainingWork = msTotalWorkToday - msWorked; // Milisegundos del tiempo restante de trabajo (sin contar pausas)
    let msEndTime = Date.now() + msRemainingWork + msTotalPrevisionInBreak; // Milisegundos de la hora prevista de salida

    if (configuration.precisionMode) {
        elWorkedHours.innerHTML = round2(msWorked / 1000 / 60 / 60, 4);
        elHoursToWork.innerHTML = round2((msRemainingWork) / 1000 / 60 / 60, 4);
        elPercentaje.innerHTML = round2((msWorked/msTotalWorkToday)*100, 4); 
        elOutTime.innerHTML = new Date(msEndTime).toLocaleTimeString();
    } else {
        elWorkedHours.innerHTML = toHumanReadable(msWorked);
        elHoursToWork.innerHTML = toHumanReadable(msRemainingWork);
        elPercentaje.innerHTML = Number(round2((msWorked/msTotalWorkToday)*100)).toLocaleString(undefined, {minimumFractionDigits: 2}) + '%'; 
        elOutTime.innerHTML = new Date(msEndTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
}

// TODO: Hacer con Intl de Javascript
function round2(number, decimals = 2) {
    return Math.round(Number(number) * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// TODO: Hacer con Intl de Javascript
function toHumanReadable(ms) {
    hours = ms / 1000 / 60 / 60;
    result = '';

    if (hours < 0) {
        hours = hours * -1;
        result += '-';
    }

    hour = Math.floor(hours);

    mins = Math.round((hours - hour) * 60);

    result += hour ? `${hour}h ${mins}min` : `${mins}min`;
    
    return result;
}

function isValidNumber(item) {
    return item !== undefined && item !== null && Number(item) !== NaN;
}


