    /**
     * D3.js DATA VISUALIZATION
     */
d3.csv("Data/historique_feux.csv").then(function(csvData) {
       const data = csvData.map(d => {
        return { 
            year: parseInt(d.Annee),     
            hectares: parseFloat(d.Hectares) 
        };
    });

    console.log("Données chargées :", data);
    renderBars(data); // On lance le dessin une fois les données prêtes

}).catch(function(error) {
    console.error("Erreur lors du chargement du CSV :", error);
});


function renderBars(data) {
    const container = document.getElementById('d3-chart');
    if(!container) return;
    container.innerHTML = '';
    
    const maxHa = Math.max(...data.map(d => d.hectares));

    data.forEach(d => {
        const barWrapper = document.createElement('div');
        barWrapper.className = 'flex-1 group relative flex flex-col justify-end h-full';
        
        const bar = document.createElement('div');
        const heightPerc = (d.hectares / maxHa) * 100;
        const is2022 = d.year === 2022;
        
        bar.className = `w-full transition-all duration-700 ease-out cursor-help relative
            ${is2022 ? 'bg-[#FF4500] shadow-[0_0_30px_rgba(255,69,0,0.6)] z-10 scale-x-110' : 'bg-white/10 hover:bg-white/30'}`;
        bar.style.height = `${Math.max(heightPerc, 0.5)}%`;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white text-black text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold z-20';
        tooltip.innerText = `${d.year}: ${Math.round(d.hectares).toLocaleString()} ha`;
        
        bar.appendChild(tooltip);
        barWrapper.appendChild(bar);
        container.appendChild(barWrapper);
    });
}

    /**
     * SIMULATOR LOGIC
     */
    function updateSim() {
        const inT = document.getElementById('inT');
        const inH = document.getElementById('inH');
        const inV = document.getElementById('inV');
        const valT = document.getElementById('valT');
        const valH = document.getElementById('valH');
        const valV = document.getElementById('valV');
        const valArea = document.getElementById('valArea');
        const firePoly = document.getElementById('firePoly');
        const geoSize = document.getElementById('geoSize');

        if (!inT || !inH || !inV) return;

        let t = parseInt(inT.value);
        let h = parseInt(inH.value);
        let v = parseInt(inV.value);
        
        valT.innerText = t;
        valH.innerText = h;
        valV.innerText = v;
        
        let base = 20;
        let riskT = Math.pow(t / 15, 3.5);
        let riskH = Math.pow(90 / h, 2.2);
        let riskV = Math.pow(1 + (v / 20), 1.8);
        
        let area = Math.round(base * riskT * riskH * riskV);
        let isMegaFire = (t >= 30 && h <= 30 && v >= 30);
        
        if (isMegaFire) {
            geoSize.innerText = "GIGANTESQUE";
            geoSize.className = "text-[#FF4500] font-bold";
            firePoly.style.background = "rgba(220, 0, 0, 0.9)";
            firePoly.style.boxShadow = "0 0 40px rgba(255, 0, 0, 0.5)";
        } else if (area > 3000) {
            geoSize.innerText = "Sévère";
            geoSize.className = "text-[#FFB5A0]";
            firePoly.style.background = "rgba(255, 69, 0, 0.7)";
            firePoly.style.boxShadow = "none";
        } else {
            geoSize.innerText = "Modérée";
            geoSize.className = "text-white";
            firePoly.style.background = "rgba(255, 255, 255, 0.2)";
            firePoly.style.boxShadow = "none";
        }

        area = Math.min(area, 30000);
        valArea.innerText = Math.round(area).toLocaleString('fr-FR');
        
        let scaleY = Math.min(6, 0.5 + Math.pow(area / 1500, 0.45));
        let scaleX = Math.min(5, 0.5 + Math.pow(area / 2000, 0.45) + (v / 80));
        let skewX = v * 0.5; 
        
        firePoly.style.transform = `scaleX(${scaleX}) scaleY(${scaleY}) skewX(${skewX}deg)`;
    }

    document.addEventListener('DOMContentLoaded', () => {
        
        
        // Map Initialization
        const mapEl = document.getElementById('map');
        if (mapEl && typeof L !== 'undefined') {
            const map = L.map('map', { scrollWheelZoom: false, zoomControl: false }).setView([44.5, -0.6], 10);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© CARTO' 
            }).addTo(map);

        L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);
        
L.circleMarker([44.837789, -0.57918], {
    color: '#E5E2E1', fillColor: '#E5E2E1', fillOpacity: 0.8, radius: 5
}).addTo(map).bindTooltip("Bordeaux", { 
    permanent: true, 
    direction: 'bottom', 
    className: 'etiquette-ville' 
});


L.circleMarker([44.5936, -1.2045], {
    color: '#E5E2E1', fillColor: '#E5E2E1', fillOpacity: 0.8, radius: 4
}).addTo(map).bindTooltip("Dune du Pilat", { 
    permanent: true, 
    direction: 'right', 
    className: 'etiquette-ville' 
});
fetch('Data/perimetre_feux.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: { 
                color: "#FF4500", 
                weight: 2,        
                opacity: 0.8,     
                fillColor: "#FF4500", 
                fillOpacity: 0.4  
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.nom) {
                    layer.bindPopup(
                        `<strong>${feature.properties.nom}</strong><br>` +
                        `Surface : ${feature.properties.surface_ha} hectares`
                    );
                }
            }
        }).addTo(map);
        
    })
    .catch(error => {
        console.error("Erreur lors du chargement du fichier GeoJSON :", error);
    });

        const inputs = ['inT', 'inH', 'inV'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('input', updateSim);
        });
        updateSim();
    }
});