let elTable = document.getElementById("table");
let elPause = document.getElementById("pause");
let elWorkedHours = document.getElementById("workedHours");
let elHoursToWork = document.getElementById("hoursToWork");
let elOutRow = document.getElementById("outRow");
let elOutTime = document.getElementById("outTime");
let elPercentaje = document.getElementById("percentaje");


let now = new Date();

let hoursWorkToday = now.getDay() === 5 || now.getMonth() === 6 || now.getMonth() === 7 ? 7 : 8.5;

let presicionModeGlob = false;

let responseData;

load();

elTable.addEventListener("click", async () => {
    presicionModeGlob = !presicionModeGlob;
    chrome.storage.sync.set({ presicionMode: presicionModeGlob });

    fillTable();
});

function load() {
    chrome.storage.sync.get("presicionMode", ({ presicionMode }) => {
        presicionModeGlob = presicionMode;
        
        var formData = new FormData();
        formData.append('StartDate',new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
        formData.append('EndDate', new Date(new Date().setHours(23, 59, 59, 0)).toISOString());
        // formData.append('UserId', 'CF21EDB4-F39D-4260-82BF-535327E40716'); Quiza en algun caso haya que filtrar por UserId
        
        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'https://nervia.suzaku.es/Hr/Attendance/List_Read', true);
        xhr.send(formData);
        
        xhr.onreadystatechange = function () {
            if (this.readyState != 4) return;
        
            if (this.status == 200) {
                responseData = JSON.parse(this.responseText);

                fillTable();

                window.setInterval(function () {
                    fillTable();
                }, 1000);
            } else {
                elPause.innerHTML = 'Error al conectar';
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

        // outs.push(new Date().getTime() - 45 * 60 * 1000); // Crear una salida ficticia hace 45 min
        // ins.push(new Date().getTime() - 15 * 60 * 1000); // Crear una entrada ficticia hace 15 min
    }

    if (ins.length > outs.length) {
        outs.push(new Date().getTime())
    } else {
        elPause.style.display = 'inline-block';

        if (outs.length > 0) {
            outs.sort((a, b) => { a - b });
            
            if (presicionModeGlob) {
                hoursPause = round2((new Date().getTime() - outs[0])/1000/60/60, 3);
            } else {
                hoursPause = toHumanReadable((new Date().getTime() - outs[0])/1000/60/60);
            }

            elPause.setAttribute('title', hoursPause);
        } else {
            elPercentaje.removeAttribute('title');
        }
    }

    ins.sort((a, b) => { a - b });
    outs.sort((a, b) => { a - b });

    for (let i = 0; i < ins.length; i++) {
        msCount += outs[i] - ins[i];
    }

    workedHours = msCount / 1000 / 60 / 60;

    if (hoursWorkToday === 7.5 || ins.length > 1) {
        elOutRow.style.display = 'table-row';
    }
    msLeft = (hoursWorkToday - workedHours)*1000*60*60;

    if (presicionModeGlob) {
        elWorkedHours.innerHTML = round2(workedHours, 3);
        elHoursToWork.innerHTML = round2(hoursWorkToday - workedHours, 3);
        elPercentaje.innerHTML = round2((workedHours/hoursWorkToday)*100, 3); 
        elOutTime.innerHTML = new Date(new Date().getTime() + msLeft).toLocaleTimeString();
    } else {
        elWorkedHours.innerHTML = toHumanReadable(workedHours);
        elHoursToWork.innerHTML = toHumanReadable(hoursWorkToday - workedHours);
        elPercentaje.innerHTML = Number(round2((workedHours/hoursWorkToday)*100)).toLocaleString(undefined, {minimumFractionDigits: 2}) + '%'; 
        elOutTime.innerHTML = new Date(new Date().getTime() + msLeft).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
}

function round2(number, decimals = 2) {
    return Math.round(Number(number) * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function toHumanReadable(hours) {
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


