// src/data/chile.ts
export const REGIONES = [
  "Arica y Parinacota","Tarapacá","Antofagasta","Atacama","Coquimbo",
  "Valparaíso","Metropolitana","O’Higgins","Maule","Ñuble",
  "Biobío","La Araucanía","Los Ríos","Los Lagos","Aysén","Magallanes"
] as const;

type Region = typeof REGIONES[number];

export const COMUNAS: Record<Region, string[]> = {
  "Arica y Parinacota": ["Arica","Camarones","Putre","General Lagos"],
  "Tarapacá": ["Iquique","Alto Hospicio","Pozo Almonte","Pica","Huara","Camiña","Colchane"],
  "Antofagasta": ["Antofagasta","Mejillones","Taltal","Sierra Gorda","Calama","San Pedro de Atacama","Ollagüe"],
  "Atacama": ["Copiapó","Caldera","Tierra Amarilla","Vallenar","Huasco","Freirina","Alto del Carmen","Chañaral","Diego de Almagro"],
  "Coquimbo": ["La Serena","Coquimbo","Andacollo","Vicuña","Paihuano","Ovalle","Monte Patria","Punitaqui","Combarbalá","Illapel","Salamanca","Los Vilos"],
  "Valparaíso": [
    "Valparaíso","Viña del Mar","Concón","Quilpué","Villa Alemana",
    "Quintero","Puchuncaví","Casablanca","Quillota","La Calera","La Cruz","Hijuelas","Nogales",
    "San Antonio","Cartagena","El Quisco","El Tabo","Algarrobo","Santo Domingo",
    "San Felipe","Llaillay","Catemu","Panquehue","Putaendo","Santa María","Los Andes","Calle Larga","Rinconada",
    "Petorca","Cabildo","La Ligua","Papudo","Zapallar","Isla de Pascua","Juan Fernández"
  ],
  "Metropolitana": [
    "Santiago","Providencia","Las Condes","Lo Barnechea","Ñuñoa","La Reina","Macul","Peñalolén",
    "Maipú","Cerrillos","Estación Central","Pudahuel","Quinta Normal","Lo Prado","Cerro Navia","Renca",
    "Independencia","Recoleta","Conchalí","Huechuraba","Quilicura","Vitacura","San Miguel","La Cisterna",
    "San Joaquín","San Ramón","La Granja","El Bosque","La Pintana","Puente Alto","San Bernardo","Buin","Paine","Calera de Tango","Melipilla","Talagante","Peñaflor","Isla de Maipo","El Monte","Curacaví","Colina","Lampa","Tiltil","Pirque"
  ],
  "O’Higgins": ["Rancagua","Machalí","Graneros","Mostazal","Codegua","Requínoa","San Vicente","Peumo","Pichidegua","Las Cabras","San Fernando","Chimbarongo","Nancagua","Placilla","Santa Cruz","Pumanque","Lolol","Paredones","Pichilemu","Marchigüe","Navidad","Litueche","La Estrella"],
  "Maule": ["Talca","San Clemente","Pelarco","Maule","San Rafael","Curicó","Teno","Romeral","Molina","Sagrada Familia","Hualañé","Licantén","Vichuquén","Linares","Yerbas Buenas","Colbún","Longaví","Parral","Retiro","Cauquenes","Chanco","Pelluhue","Constitución","Empedrado","Río Claro"],
  "Ñuble": ["Chillán","Chillán Viejo","Bulnes","Quillón","San Ignacio","Yungay","Pemuco","El Carmen","Coihueco","San Carlos","Ñiquén","San Fabián","Coelemu","Ránquil","Treguaco","Portezuelo","Cobquecura","Quirihue","Ninhue"],
  "Biobío": ["Concepción","Talcahuano","Hualpén","San Pedro de la Paz","Chiguayante","Penco","Tomé","Florida","Hualqui","Coronel","Lota","Santa Juana","Arauco","Curanilahue","Lebu","Los Álamos","Cañete","Los Ángeles","Mulchén","Nacimiento","Negrete","Quilaco","Quilleco","Santa Bárbara","Tucapel","Yumbel","Cabrero","Antuco"],
  "La Araucanía": ["Temuco","Padre Las Casas","Lautaro","Vilcún","Gorbea","Pitrufquén","Freire","Nueva Imperial","Carahue","Saavedra","Teodoro Schmidt","Toltén","Cunco","Melipeuco","Angol","Collipulli","Renaico","Traiguén","Victoria","Curacautín","Lonquimay","Ercilla","Los Sauces","Purén","Lumaco","Galvarino","Perquenco","Cholchol"],
  "Los Ríos": ["Valdivia","Lanco","Mariquina","Máfil","Corral","Paillaco","Futrono","Lago Ranco","Río Bueno","La Unión"],
  "Los Lagos": ["Puerto Montt","Puerto Varas","Llanquihue","Frutillar","Calbuco","Maullín","Los Muermos","Osorno","Río Negro","Purranque","San Juan de la Costa","San Pablo","Castro","Ancud","Quellón","Chonchi","Dalcahue","Quemchi","Curaco de Vélez","Puqueldón","Queilen","Quinchao","Futaleufú","Chaitén","Hualaihué","Palena"],
  "Aysén": ["Coyhaique","Aysén","Cisnes","Guaitecas","Chile Chico","Río Ibáñez","Cochrane","O’Higgins","Tortel","Lago Verde"],
  "Magallanes": ["Punta Arenas","Natales","Torres del Paine","Laguna Blanca","Río Verde","San Gregorio","Porvenir","Timaukel","Primavera","Cabo de Hornos","Antártica"]
};
