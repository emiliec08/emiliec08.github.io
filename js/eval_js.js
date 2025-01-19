// AUTRICE : Emilie CHAFAI 
// GéoNum M2 - 2025 
// Création : 30/12/2024  | MAJ : 19/01/2025

////// GÉRER LE FOND DE PLAN - MEP
// "map" est la variable que nous avons créée dans le fichier HTML.
// J'ai défini un niveau de zoom minimum pour éviter de voir toute la planète et rester sur notre zone d'étude.
// En revanche, je n'ai pas imposé de niveau de zoom maximal. 
var map = L.map('map', {
    minZoom: 9
}
);
var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Attention toujours mettre le copyright, il est important + ajout de mon nom,promo,master
var osmAttrib = 'Map data © OpenStreetMap contributors | GéoNum M2 2025 : Emilie CHAFAÏ ';
var osm = new L.TileLayer(osmUrl, { attribution: osmAttrib }).addTo(map);
map.setView([45.719, 4.918], 10); // Le niveau de zoom 10 permet d’avoir une échelle suffisamment large pour visualiser la Métropole de Lyon.


// Afficher le niveau de zoom dans la console (Ctrl + Maj + I pour ouvrir la console)
map.on('zoomend', function (e) {
    console.log("Le zoom est de :", map.getZoom());
});

// Echelle 
var scaleOptions = {
    position: 'bottomleft', // Où afficher la commande
    metric: true, // voir en mètre/klm
    imperial: false // ne pas voir en feet/miles
};
var scaleControl = L.control.scale(scaleOptions);

// Ajouter l'échelle à la carte
scaleControl.addTo(map);



//////////////////////////////////////////////////////// GÉRER LES DONNÉES UNE PAR UNE ( 1 FONCTION = 1 DONNEE )////////////////////////////////////////

// Pour visualiser la carte et les données, placez le dossier en mode "Open Folder" puis lancez "Go Live"

// Déclarer un objet global pour stocker les couches (car les variables n’existent qu’au sein de leur fonction)
let couches = {
    markers: null,
    piste: null,
    commune: null
};

// Déclaration d'une variable pour stocker les couches à afficher dans L.control.layers
let couches_overlay = {};

// Déclaration d'une variable pour stocker la couche OSM à afficher dans L.control.layers
let baseLayers = {
    "OpenStreetMap": osm
};


////// CRÉATION DE LA FONCTION STYLE --> POINT
// Créer une fonction pour retourner l’icône selon la catégorie (équipements sportifs).
// Ici, on met en avant les "catégories" plutôt que les "types" d’installations sportives.
// L’objectif est d’ajouter autant de "case" que nécessaire selon les catégories.
function getIconByCategory(category, isBig = false) {
    // Définir la taille en fonction du paramètre
    let size = isBig ? [48, 48] : [32, 32]; // isBig = un booléen (true(=48,48)/false(=32,32)) qu’on passe en paramètre de la taille (size et aussi anchor ou placement du point)
    let anchor = isBig ? [24, 48] : [16, 32];

    switch (category) {
        case 'Autres équipements': // nom de la catégorie
            return L.icon({
                iconUrl: 'image/endroit.png',
                iconSize: size,
                iconAnchor: anchor,
            });
        case 'Bassins aquatiques':
            return L.icon({
                iconUrl: 'image/piscine.png',
                iconSize: size,
                iconAnchor: anchor,
            });
        case 'Courts de tennis':
            return L.icon({
                iconUrl: 'image/tennis.png',
                iconSize: size,
                iconAnchor: anchor,
            });
        case 'Equipements Ext.':
            return L.icon({
                iconUrl: 'image/triathlon.png',
                iconSize: size,
                iconAnchor: anchor,
            });
        case 'Nature':
            return L.icon({
                iconUrl: 'image/nature.png',
                iconSize: size,
                iconAnchor: anchor,
            });
        case 'Salles de pratiques collectives':
            return L.icon({
                iconUrl: 'image/stade.png',
                iconSize: size,
                iconAnchor: anchor,
            });
        case 'Terrains de grands jeux':
            return L.icon({
                iconUrl: 'image/basketball.png',
                iconSize: size,
                iconAnchor: anchor,
            });
    }
}


////// GÉRER LES DONNÉES SUR LES EQPT SPORTIFS : PONCTUELS (Fonction) (+ ajouter : style + clusterisation + pop-up)
async function charger_geojson_eqpt(url) {
    let response = await fetch(url);
    let data = await response.json();

    // Création de la couche GeoJSON avec pointToLayer
    let eqpt_sports = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
        // Stylise le point    
            //Récupére la catégorie
            let cat = feature.properties.categorie;
            //Définit les deux versions d’icône
            let smallIcon = getIconByCategory(cat, false); // lorsque isBig est faux donc icon = 32px
            let bigIcon = getIconByCategory(cat, true); // lorsque isBig est vrai donc icon = 48px
            //Crée le marker (petite icône par défaut parce qu'on ne le survol pas quand on démarre la carte)
            let marker = L.marker(latlng, { icon: smallIcon });
        // Pop-up   
            // Récupére l'attribut "installation"
            let nomInstallation = feature.properties.installation || "Installation inconnue"; //si pas de nom d'installation
            // Lier un popup
            marker.bindPopup("<b>" + nomInstallation + "</b>", {
                className: 'my_popup'
            });

            //Gérer les événements, comme on le fait pour les polygones, lorque on survol
            //Agrandir l'icon au survol : 
            marker.on('mouseover', function (e) {
                // va agrandir l’icône
                e.target.setIcon(bigIcon);
            // Création Buffer
                // Crée ou affiche le buffer (cercle)
                if (!marker._bufferCircle) {
                    // On crée le cercle la première fois seulement
                    marker._bufferCircle = L.circle(latlng, {
                        radius: 300,        // 300 mètres
                        color: 'red',       // Couleur du contour
                        weight: 2,          // Épaisseur du contour
                        fillColor: 'red',   // Couleur de remplissage
                        fillOpacity: 0.2    // Opacité du remplissage
                    });
                }
                marker._bufferCircle.addTo(map); // ajout du buffer à la carte
            });
            // Lorsque le marqueur n’est plus survolé, on arrête l’événement ; sinon, les icônes resteraient toujours agrandies. 
            marker.on('mouseout', function (e) {
                // Apres on revient à une petite icône
                e.target.setIcon(smallIcon);
                // puis on retir le cercle de la carte une fois que la souris ne survol plus
                if (marker._bufferCircle) {
                    map.removeLayer(marker._bufferCircle);
                }
            });
            return marker; // On retourne le point
        }
    });

    // On crée le style de la couches de points = clusterisation 
    // Clusterisation des points
    couches.markers = L.markerClusterGroup();
    couches.markers.addLayer(eqpt_sports);
    // Ajout des clusters à la carte
    map.addLayer(couches.markers);

    // Ajouter la couche à la variable couches_overlay (= qu'on appelera à la fin pour gérer les couches)
    couches_overlay["Équipements sportifs"] = couches.markers;
}



////// GÉRER LES DONNÉES SUR LES PISTES CYCLABLES : LINEAIRES
async function charger_geojson_piste(url) {
    let response_3 = await fetch(url)
    let data_3 = await response_3.json()

    // Créer le style des pistes cyclables : on attribue une couleur à chaque localisation dans l’espace urbain
    function style_2(features) {
        switch (features.properties.localisation) {
            case 'Sur trottoir': return { color: "#008631", weight: 1.5 }; // Vert foncé + weight = permet de gérer la taille des lignes (interressant de les avoir sur chaque lignes)
            case 'Sur chaussée': return { color: "#5ced73", weight: 1.5 }; // Vert plus clair
            case null: return { color: "#cefad0", weight: 1.5 }; // Vert très clair 
            case 'Sans objet': return { color: "#cefad0", weight: 1.5 }; // Vert très clair
        }
    }
    couches.piste = L.geoJSON(data_3, { style: style_2 }).addTo(map);

    // Ajouter la couche au variable couches_overlay
    couches_overlay["Pistes cyclables"] = couches.piste;
}



////// GÉRER LES DONNÉES SUR LES COMMUNES : SURFACIQUES
async function charger_geojson_commune(url) {
    let response_2 = await fetch(url)
    let data_2 = await response_2.json()

    // Création du style de la couches de polygones selon la densité de population (comme le cours)
    function getColor(Densite) {
        return Densite > 4295 ? '#800026' :
                Densite > 2527 ? '#BD0026' :
                Densite > 1221 ? '#E31A1C' :
                Densite > 197 ? '#FC4E2A' :
                                '#FD8D3C';
    }
    function style(features) {
        return {
            fillColor: getColor(features.properties.Densite),
            weight: 1.5,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.5
        };
    }

    couches.commune = L.geoJSON(data_2, { onEachFeature: mouse_events, style: style }).addTo(map); // application du style + de la fonction mouse_events

////// ÉVÉNEMENTS LIÉS À LA COUCHE COMMUNE
    // Événements sur les communes --> Création de la fonction mouse_events = va permettre d'interroger des communes + on ajoute à cela = un zoom, une mise en brillance, une déselection
    function mouse_events(features, leaflet_object) { // attention donner un nom correcte ici moi cela est leaflet_object ne pas mettre le même nom que le nom de la couche 
        leaflet_object.on('click', function (e) { // e = les fonctions de la fonction il peut prendre n'importe quel nom
            map.fitBounds(e.target.getBounds());
            console.log('Zoom sur ' + e.target.feature.properties.NOM); // Permet d'afficher dans la console le nom de la commune sur lequel on à cliqué 
        });
        leaflet_object.on('mouseover', function (e) {  // fonction click dans leaflet, e : evemenent
            //console.log(e)
            e.target.setStyle({ color: 'blue' })
            e.target.bringToFront();
            var info_div = document.getElementById("info"); // attention : bien créer la div "info" avant dans le html
            info_div.innerHTML = "La commune de " + e.target.feature.properties.NOM + " à une densité de population de " + e.target.feature.properties.Densite + " hab./km²" // on concatene les différentes infos
        });
        leaflet_object.on('mouseout', function (toto) {
            couches.commune.resetStyle(toto.target); // on appel donc la couche ici "commune" et pas les données geojson (data_2)
        });
    }

    // Ajouter la couche au variable couches_overlay
    couches_overlay["Communes"] = couches.commune;
}


////// CHARGEMENT DONNÉES ET GESTION COUCHES
// Charger les données et ajouter les couches à L.control.layers
Promise.all([
    charger_geojson_eqpt('data/urbalyon_urbalyon.recenseqptsport.json'),
    charger_geojson_piste('data/amenagement_cyclable_metropole_lyon.json'),
    charger_geojson_commune('data/commune_metropole_lyon_.geojson')
]).then(() => {
    // Utiliser la variable couches_overlay dans L.control.layers + baseLayers (attention : la première varaible déclarée ne semble pas pouvoir être controlée par la suite)
    L.control.layers(baseLayers, couches_overlay).addTo(map);
});


////// ÉVÉNEMENTS LIÉS À LA LÉGENDE 
// Gérer les événements liés aux légendes (et aux couches)
map.on('overlayadd', function (event) {
    console.log("overlayadd:", event.name);

    if (event.name === "Communes") {
        document.getElementById("legend-communes").style.display = "block";
    }
    if (event.name === "Équipements sportifs") {
        document.getElementById("legend-eqpt").style.display = "block";
    }
    if (event.name === "Pistes cyclables") {
        document.getElementById("legend-pistes").style.display = "block";
    }
});

map.on('overlayremove', function (event) {
    console.log("overlayremove:", event.name);

    if (event.name === "Communes") {
        document.getElementById("legend-communes").style.display = "none";
        document.getElementById("info").innerHTML = "_"; // faire disparaitre les infos quand la couche commune disparait
    }
    if (event.name === "Équipements sportifs") {
        document.getElementById("legend-eqpt").style.display = "none";
    }
    if (event.name === "Pistes cyclables") {
        document.getElementById("legend-pistes").style.display = "none";
    }
});

///// FIN script 19/01/2025
















