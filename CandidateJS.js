// "Link" til mit api tilknyttet en variabel, som jeg bruger til at fetche fra
const URL = "http://localhost:8080/api"

// Fetch funktion der læser indhold fra databasen via. mit api.
function fetchCandidates() {
    fetch(URL)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            cache.addAll(data);
            //console.log(candidates)
            makeTableRows()
        });
}

// Metode der laver rækkerne i tabellen, ved at bruge data fra min cache
function makeTableRows() {
    const rows = cache.getAll().map(c => `
         <tr>
           <td>${c.id}</td>
           <td>${c.name}</td>
           <td>${c.politicalParty}</td>
           <td>${c.votes}</td>
           <td><button data-id-delete=${c.id} class="btn-danger" href="#">Slet</button></td>
           <td><button data-id-edit='${c.id}' class="btn-primary" href="#" >Rediger</button> </td>
         </tr>
        `)
    document.getElementById("t-body").innerHTML = rows.join("")
}

// Her laver jeg en cache funktion, som kan gemme informationer i frontend, for at mindske kommunikatoinen mellem frontend og backend
function localCache() {
    let candidates = []
    const addEdit = (candidate, method) => {
        if (method === "POST") {
            candidates.push(candidate)
        } else if (method === "PUT") {
            candidates = candidates.map(c => c.id == candidate.id ? candidate : c)
        }
    }
    return {
        getAll: () => candidates,
        addAll: (all) => candidates = all,
        deleteOne: (id) => candidates = candidates.filter(c => c.id !== Number(id)),
        findById: (id) => candidates.find(c => c.id == id),
        addEdit: addEdit
    }
}

// Funktion der opsætter handlers (tilknytter funktioner til diverse id's med onclick)
function setHandlers() {
    document.getElementById("t-body").onclick = handleTable
    document.getElementById("btn-save").onclick = saveCandidate
    document.getElementById("btn-add-candidate").onclick = newCandidate
    document.getElementById("party-filter").onclick = filterParty
    document.getElementById("show-chart").onclick = displayChartModal
}
setHandlers()

// Funktion der håndtere mouse events i min tabel, samt fetch til delete
function handleTable(evt) {
    evt.preventDefault()
    evt.stopPropagation()
    const target = evt.target;

    // Hvis der trykkes på slet knappen, tages fat i id'et her, hvor efter der fetches med det id, fra linje 74
    if (target.dataset.idDelete) {
        const idToDelete = Number(target.dataset.idDelete)
        const options = {
            method: "DELETE",
            headers: {'Accept': 'application/json'},
        }
        fetch(URL + "/" + idToDelete, options)
            .then(res => {
                if (res.ok) {
                    cache.deleteOne(idToDelete)
                    console.log(idToDelete)
                    makeTableRows()
                    location.reload()
                }
            })
    }
    // Hvis der trykkes på rediger, hentes her det matchende objekt via cache, som kalder displayModal med det objekt som parametre
    if (target.dataset.idEdit) {
        const idToEdit = Number(target.dataset.idEdit)
        const candidate = cache.findById(idToEdit)
        displayModal(candidate)
    }
}

// Funktion der viser min modal, samt henter informationer når der editeres
function displayModal(candidate) {
    const modal = new bootstrap.Modal(document.getElementById('min-modal'))
    document.getElementById("candidate-modal").innerText = candidate.id ? "Rediger kandidat" : "Tilføj kandidat"
    document.getElementById("candidate-id").innerText = candidate.id
    document.getElementById("input-name").value = candidate.name
    document.getElementById("input-politicalParty").value = candidate.politicalParty
    document.getElementById("input-votes").value = candidate.votes

    modal.show()
}

// Metode der gemmer en ny kandidat i databasen, eller gemmer den redigerede Candidate i databasen
function saveCandidate() {
    const candidate = {}

    candidate.id = Number(document.getElementById("candidate-id").innerText)
    candidate.name = document.getElementById("input-name").value
    candidate.politicalParty = document.getElementById("input-politicalParty").value
    candidate.votes = document.getElementById("input-votes").value

    const method = candidate.id ? "PUT" : "POST"
    const url = (method === "PUT") ? URL+"/"+candidate.id : URL
    const options = {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(candidate)
    }
    fetch(url,options)
        .then(res=>{
            if(!res.ok){
                throw "Fejl, der kunne ikke oprettes eller redigeres"
            }
            return res.json()
        })
        .then(candidate=>{
            cache.addEdit(candidate,method)
            makeTableRows()
        })
        .catch(e=>alert(e))
}

// Funktion der kalder displayModal med et tomt Candidate objekt, så disse fields kan få værdier når man taster dem ind via. web
function newCandidate() {
    displayModal({
        id : null,
        name: "",
        politicalParty: "",
        votes: ""
    })
}

// Funktion der sortere efter parti
function filterParty() {
    const list = cache.getAll().sort((a,b) => {
        if(a.politicalParty < b.politicalParty) {
            return -1
        } if(a.politicalParty > b.politicalParty) {
            return 1
        }
        return 0
    })
    cache.addAll(list)
    makeTableRows(cache.getAll())
    console.log(list)
}

// Her loader jeg fra mit eksterne link (google charts)
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

// Funktion der tegner et google chart over stemmerne fordelt på de forskellige partier
function drawChart() {
    // Her visualisere google et array og laver det om til et diagram (DETTE ER HENTET FRA GOOGLE - se kildehenvisning)
    const chartData = google.visualization.arrayToDataTable([
        ['Task', 'Total votes'],
        ['Socialdemokratiet (A)', 749],
        ['Socialistisk folkeparti (F)', 309],
        ['Det konservative folkeparti (C)', 539],
        ['Dansk Folkeparti (DF)', 21],
        ['Venstre (V)', 586],
        ['Enhedslisten (Ø)', 76]
    ]);

    const options = {'title': 'Stemmer i alt fordelt på partierne', 'width': 450, 'height': 350}
    const chart = new google.visualization.PieChart(document.getElementById('chart-div'));
    chart.draw(chartData, options);
}

//  Funktion der viser min chart modal (Den er tilknyttet en knap i min setHandler funktion)
function displayChartModal() {
    const chartModal = new bootstrap.Modal(document.getElementById('chart-Modal'))
    chartModal.show()
}

const cache = localCache()
fetchCandidates()
