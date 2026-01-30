// Mapeo de animales con sus imágenes
export interface Animal {
  numero: number;
  codigo: string;
  nombre: string;
  imagen: string;
  color?: string;
}

// Función helper para obtener la ruta de la imagen
const getAnimalImage = (filename: string): string => {
  return new URL(`../animalitos/${filename}`, import.meta.url).href;
};

// Lista completa de animales con sus imágenes
export const animals: Animal[] = [
  { numero: 0,codigo: '00', nombre: "Ballena", imagen: getAnimalImage("00ballena.png") },
  { numero: 0,codigo: '0', nombre: "Delfin", imagen: getAnimalImage("0delfin.png") },
  { numero: 1,codigo: '1', nombre: "Carnero", imagen: getAnimalImage("1carnero.png") },
  { numero: 2,codigo: '2', nombre: "Toro", imagen: getAnimalImage("2toro.png") },
  { numero: 3,codigo: '3', nombre: "Cienpies", imagen: getAnimalImage("3cienpies.png") },
  { numero: 4,codigo: '4', nombre: "Alacran", imagen: getAnimalImage("4alacran.png") },
  { numero: 5,codigo: '5', nombre: "Leon", imagen: getAnimalImage("5leon.png") },
  { numero: 6, codigo: '6', nombre: "Rana", imagen: getAnimalImage("6rana.png") },
  { numero: 7, codigo: '7', nombre: "Perico", imagen: getAnimalImage("7perico.png") },
  { numero: 8, codigo: '8', nombre: "Raton", imagen: getAnimalImage("8raton.png") },
  { numero: 9, codigo: '9', nombre: "Aguila", imagen: getAnimalImage("9aguila.png") },
  { numero: 10, codigo: '10', nombre: "Tigre", imagen: getAnimalImage("10tigre.png") },
  { numero: 11, codigo: '11', nombre: "Gato", imagen: getAnimalImage("11gato.png") },
  { numero: 12, codigo: '12', nombre: "Caballo", imagen: getAnimalImage("12caballo.png") },
  { numero: 13, codigo: '13', nombre: "Mono", imagen: getAnimalImage("13mono.png") },
  { numero: 14, codigo: '14', nombre: "Paloma", imagen: getAnimalImage("14paloma.png") },
  { numero: 15, codigo: '15', nombre: "Zorro", imagen: getAnimalImage("15zorro.png") },
  { numero: 16, codigo: '16', nombre: "Oso", imagen: getAnimalImage("16oso.png") },
  { numero: 17, codigo: '17', nombre: "Pavo", imagen: getAnimalImage("17pavo.png") },
  { numero: 18, codigo: '18', nombre: "Burro", imagen: getAnimalImage("18burro.png") },
  { numero: 19, codigo: '19', nombre: "Hormiga", imagen: getAnimalImage("19hormiga.png") },
  { numero: 20, codigo: '20', nombre: "Cerdo", imagen: getAnimalImage("20cerdo.png") },
  { numero: 21, codigo: '21', nombre: "Gallo", imagen: getAnimalImage("21gallo.png") },
  { numero: 22, codigo: '22', nombre: "Camello", imagen: getAnimalImage("22camello.png") },
  { numero: 23, codigo: '23', nombre: "Cebra", imagen: getAnimalImage("23cebra.png") },
  { numero: 24, codigo: '24', nombre: "Iguana", imagen: getAnimalImage("24iguana.png") },
  { numero: 25, codigo: '25', nombre: "Gallina", imagen: getAnimalImage("25gallina.png") },
  { numero: 26, codigo: '26', nombre: "Vaca", imagen: getAnimalImage("26vaca.png") },
  { numero: 27, codigo: '27', nombre: "Perro", imagen: getAnimalImage("27perro.png") },
  { numero: 28, codigo: '28', nombre: "Condor", imagen: getAnimalImage("28condor.png") },
  { numero: 29, codigo: '29', nombre: "Elefante", imagen: getAnimalImage("29elefante.png") },
  { numero: 30, codigo: '30', nombre: "Caiman", imagen: getAnimalImage("30caiman.png") },
  { numero: 31, codigo: '31', nombre: "Capibara", imagen: getAnimalImage("31capibara.png") },
  { numero: 32, codigo: '32', nombre: "Ardilla", imagen: getAnimalImage("32ardilla.png") },
  { numero: 33, codigo: '33', nombre: "Pescado", imagen: getAnimalImage("33pescado.png") },
  { numero: 34, codigo: '34', nombre: "Venado", imagen: getAnimalImage("34venado.png") },
  { numero: 35, codigo: '35', nombre: "Jirafa", imagen: getAnimalImage("35jirafa.png") },
  { numero: 36, codigo: '36', nombre: "Culebra", imagen: getAnimalImage("36culebra.png") },
];

export const getAnimalByCodigo = (codigo: string): Animal | undefined => {
  return animals.find(animal => animal.codigo === codigo);
};

// Buscar por número (puede tener duplicados)
export const getAnimalByNumero = (numero: number): Animal | undefined => {
  return animals.find(animal => animal.numero === numero);
};

// Buscar por nombre
export const getAnimalByNombre = (nombre: string): Animal | undefined => {
  return animals.find(animal => 
    animal.nombre.toLowerCase() === nombre.toLowerCase()
  );
};
// Animales principales para la ruleta (los primeros 12)
export const mainAnimals: Animal[] = animals.slice(0, 40); // Desde Carnero (1) hasta Caballo (12)
