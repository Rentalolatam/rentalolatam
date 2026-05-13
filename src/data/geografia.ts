export type Departamento = {
  nombre: string
  municipios: string[]
}

export const DEPARTAMENTOS_GUATEMALA: Departamento[] = [
  { nombre: "Guatemala", municipios: ["Guatemala", "Mixco", "Villa Nueva", "San Miguel Petapa", "Chinautla", "San Pedro Ayampuc", "Amatitlán", "Santa Catarina Pinula", "San José Pinula", "Fraijanes", "Palencia", "Villa Canales", "San Raymundo", "Chuarrancho"] },
  { nombre: "Sacatepéquez", municipios: ["Antigua Guatemala", "Ciudad Vieja", "Jocotenango", "Pastores", "San Antonio Aguas Calientes", "San Bartolomé Milpas Altas", "San Lucas Sacatepéquez", "San Miguel Dueñas", "Santa Lucía Milpas Altas", "Santa María de Jesús", "Santiago Sacatepéquez", "Santo Domingo Xenacoj", "Sumpango"] },
  { nombre: "Chimaltenango", municipios: ["Chimaltenango", "Acatenango", "El Tejar", "Parramos", "Patzicía", "Patzún", "Pochuta", "San Andrés Itzapa", "San José Poaquil", "San Martín Jilotepeque", "Santa Apolonia", "Santa Cruz Balanyá", "Tecpán Guatemala", "Yepocapa", "Zaragoza"] },
  { nombre: "Escuintla", municipios: ["Escuintla", "Guanagazapa", "Iztapa", "La Democracia", "La Gomera", "Masagua", "Nueva Concepción", "Palín", "San José", "San Vicente Pacaya", "Santa Lucía Cotzumalguapa", "Siquinalá", "Tiquisate"] },
  { nombre: "Santa Rosa", municipios: ["Cuilapa", "Barberena", "Casillas", "Chiquimulilla", "Guazacapán", "Nueva Santa Rosa", "Oratorio", "Pueblo Nuevo Viñas", "San Juan Tecuaco", "San Rafael Las Flores", "Santa Cruz Naranjo", "Santa María Ixhuatán", "Santa Rosa de Lima", "Taxisco"] },
  { nombre: "Sololá", municipios: ["Sololá", "Concepción", "Nahualá", "Panajachel", "San Andrés Semetabaj", "San Antonio Palopó", "San José Chacayá", "San Juan La Laguna", "San Lucas Tolimán", "San Marcos La Laguna", "San Pablo La Laguna", "San Pedro La Laguna", "Santa Catarina Ixtahuacán", "Santa Catarina Palopó", "Santa Clara La Laguna", "Santa Cruz La Laguna", "Santa Lucía Utatlán", "Santa María Visitación", "Santiago Atitlán"] },
  { nombre: "Totonicapán", municipios: ["Totonicapán", "Momostenango", "San Andrés Xecul", "San Bartolo", "San Cristóbal Totonicapán", "San Francisco El Alto", "Santa Lucía La Reforma", "Santa María Chiquimula"] },
  { nombre: "Quetzaltenango", municipios: ["Quetzaltenango", "Almolonga", "Cantel", "Coatepeque", "Colomba", "Concepción Chiquirichapa", "El Palmar", "Flores Costa Cuca", "Génova", "Huitán", "La Esperanza", "Olintepeque", "Ostuncalco", "Palestina de Los Altos", "Salcajá", "San Carlos Sija", "San Francisco La Unión", "San Juan Ostuncalco", "San Marcos Sija", "San Mateo", "San Miguel Sigüilá", "Sibilia", "Zunil"] },
  { nombre: "Suchitepéquez", municipios: ["Mazatenango", "Chicacao", "Cuyotenango", "Patulul", "Pueblo Nuevo", "Río Bravo", "Samayac", "San Antonio Suchitepéquez", "San Bernardino", "San Francisco Zapotitlán", "San Gabriel", "San José El Ídolo", "San Juan Bautista", "San Lorenzo", "San Miguel Panán", "San Pablo Jocopilas", "Santa Bárbara", "Santo Domingo Suchitepéquez", "Santo Tomás La Unión", "Zunilito"] },
  { nombre: "Retalhuleu", municipios: ["Retalhuleu", "Champerico", "El Asintal", "Nuevo San Carlos", "San Andrés Villa Seca", "San Felipe", "San Martín Zapotitlán", "San Sebastián", "Santa Cruz Muluá"] },
  { nombre: "San Marcos", municipios: ["San Marcos", "Ayutla", "Catarina", "Comitancillo", "Concepción Tutuapa", "El Quetzal", "El Rodeo", "El Tumbador", "Ixchiguán", "La Blanca", "La Reforma", "Malacatán", "Nuevo Progreso", "Ocós", "Pajapita", "Río Blanco", "San Antonio Sacatepéquez", "San Cristóbal Cucho", "San José El Rodeo", "San José Ojetenam", "San Lorenzo", "San Miguel Ixtahuacán", "San Pablo", "San Pedro Sacatepéquez", "San Rafael Pie de La Cuesta", "Sibinal", "Sipacapa", "Tacaná", "Tajumulco", "Tejutla"] },
  { nombre: "Huehuetenango", municipios: ["Huehuetenango", "Aguacatán", "Chiantla", "Colotenango", "Concepción Huista", "Cuilco", "Ixtahuacán", "Jacaltenango", "La Democracia", "La Libertad", "Malacatancito", "Nentón", "San Antonio Huista", "San Gaspar Ixchil", "San Ildefonso Ixtahuacán", "San Juan Atitán", "San Juan Ixcoy", "San Mateo Ixtatán", "San Miguel Acatán", "San Pedro Necta", "San Rafael La Independencia", "San Rafael Petzal", "San Sebastián Coatán", "San Sebastián Huehuetenango", "Santa Ana Huista", "Santa Bárbara", "Santa Cruz Barillas", "Santa Eulalia", "Santiago Chimaltenango", "Tectitán", "Todos Santos Cuchumatán", "Unión Cantinil"] },
  { nombre: "Quiché", municipios: ["Santa Cruz del Quiché", "Canillá", "Chajul", "Chicamán", "Chiché", "Chichicastenango", "Chinique", "Cunén", "Ixcán", "Joyabaj", "Nebaj", "Pachalum", "Patzité", "San Andrés Sajcabajá", "San Antonio Ilotenango", "San Bartolomé Jocotenango", "San Juan Cotzal", "San Pedro Jocopilas", "Sacapulas", "Uspantán", "Zacualpa"] },
  { nombre: "Baja Verapaz", municipios: ["Salamá", "Cubulco", "El Chol", "Granados", "Purulhá", "Rabinal", "San Jerónimo", "San Miguel Chicaj"] },
  { nombre: "Alta Verapaz", municipios: ["Cobán", "Cahabón", "Carcha", "Chahal", "Chisec", "Fray Bartolomé de las Casas", "Lanquín", "Panzós", "Raxruhá", "San Cristóbal Verapaz", "San Juan Chamelco", "San Pedro Carchá", "Santa Cruz Verapaz", "Santa María Cahabón", "Senahú", "Tamahú", "Tactic", "Tucurú"] },
  { nombre: "Petén", municipios: ["Flores", "Dolores", "El Chal", "La Libertad", "Las Cruces", "Melchor de Mencos", "Poptún", "San Andrés", "San Benito", "San Francisco", "San José", "San Luis", "Santa Ana", "Sayaxché"] },
  { nombre: "Izabal", municipios: ["Puerto Barrios", "El Estor", "Livingston", "Los Amates", "Morales"] },
  { nombre: "Zacapa", municipios: ["Zacapa", "Cabañas", "Estanzuela", "Gualán", "Huité", "La Unión", "Río Hondo", "San Diego", "Teculután", "Usumatlán"] },
  { nombre: "Chiquimula", municipios: ["Chiquimula", "Camotán", "Concepción Las Minas", "Esquipulas", "Ipala", "Jocotán", "Olopa", "Quezaltepeque", "San Jacinto", "San José La Arada", "San Juan Ermita"] },
  { nombre: "Jalapa", municipios: ["Jalapa", "Mataquescuintla", "Monjas", "San Carlos Alzatate", "San Luis Jilotepeque", "San Manuel Chaparrón", "San Pedro Pinula"] },
  { nombre: "Jutiapa", municipios: ["Jutiapa", "Agua Blanca", "Asunción Mita", "Atescatempa", "Comapa", "Conguaco", "El Adelanto", "El Progreso", "Jalpatagua", "Jerez", "Moyuta", "Pasaco", "Quesada", "San José Acatempa", "Santa Catarina Mita", "Yupiltepeque", "Zapotitlán"] },
  { nombre: "El Progreso", municipios: ["Guastatoya", "El Jícaro", "Morazán", "San Agustín Acasaguastlán", "San Antonio La Paz", "San Cristóbal Acasaguastlán", "Sanarate", "Sansare"] },
]

export const ZONAS_CIUDAD_GUATEMALA = Array.from({ length: 25 }, (_, i) => `Zona ${i + 1}`)

export const PAISES = [
  "Guatemala",
  "Costa Rica",
  "El Salvador",
  "Honduras",
  "Nicaragua",
  "Panamá",
  "Ecuador",
  "Colombia",
  "Perú",
  "República Dominicana",
]
