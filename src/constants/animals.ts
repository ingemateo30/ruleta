// Mapeo de animales con sus imágenes
export interface Animal {
  numero: number;
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
  { numero: 0, nombre: "Ballena", imagen: getAnimalImage("00ballena.png") },
  { numero: 0, nombre: "Delfín", imagen: getAnimalImage("0delfin.png") },
  { numero: 1, nombre: "Carnero", imagen: getAnimalImage("1carnero.png") },
  { numero: 2, nombre: "Toro", imagen: getAnimalImage("2toro.png") },
  { numero: 3, nombre: "Ciempiés", imagen: getAnimalImage("3cienpies.png") },
  { numero: 4, nombre: "Alacrán", imagen: getAnimalImage("4alacran.png") },
  { numero: 5, nombre: "León", imagen: getAnimalImage("5leon.png") },
  { numero: 6, nombre: "Rana", imagen: getAnimalImage("6rana.png") },
  { numero: 7, nombre: "Perico", imagen: getAnimalImage("7perico.png") },
  { numero: 8, nombre: "Ratón", imagen: getAnimalImage("8raton.png") },
  { numero: 9, nombre: "Águila", imagen: getAnimalImage("9aguila.png") },
  { numero: 10, nombre: "Tigre", imagen: getAnimalImage("10tigre.png") },
  { numero: 11, nombre: "Gato", imagen: getAnimalImage("11gato.png") },
  { numero: 12, nombre: "Caballo", imagen: getAnimalImage("12caballo.png") },
  { numero: 13, nombre: "Mono", imagen: getAnimalImage("13mono.png") },
  { numero: 14, nombre: "Paloma", imagen: getAnimalImage("14paloma.png") },
  { numero: 15, nombre: "Zorro", imagen: getAnimalImage("15zorro.png") },
  { numero: 16, nombre: "Oso", imagen: getAnimalImage("16oso.png") },
  { numero: 17, nombre: "Pavo", imagen: getAnimalImage("17pavo.png") },
  { numero: 18, nombre: "Burro", imagen: getAnimalImage("18burro.png") },
  { numero: 19, nombre: "Hormiga", imagen: getAnimalImage("19hormiga.png") },
  { numero: 20, nombre: "Cerdo", imagen: getAnimalImage("20cerdo.png") },
  { numero: 21, nombre: "Gallo", imagen: getAnimalImage("21gallo.png") },
  { numero: 22, nombre: "Camello", imagen: getAnimalImage("22camello.png") },
  { numero: 23, nombre: "Cebra", imagen: getAnimalImage("23cebra.png") },
  { numero: 24, nombre: "Iguana", imagen: getAnimalImage("24iguana.png") },
  { numero: 25, nombre: "Gallina", imagen: getAnimalImage("25gallina.png") },
  { numero: 26, nombre: "Vaca", imagen: getAnimalImage("26vaca.png") },
  { numero: 27, nombre: "Perro", imagen: getAnimalImage("27perro.png") },
  { numero: 28, nombre: "Cóndor", imagen: getAnimalImage("28condor.png") },
  { numero: 29, nombre: "Elefante", imagen: getAnimalImage("29elefante.png") },
  { numero: 30, nombre: "Caimán", imagen: getAnimalImage("30caiman.png") },
  { numero: 31, nombre: "Capibara", imagen: getAnimalImage("31capibara.png") },
  { numero: 32, nombre: "Ardilla", imagen: getAnimalImage("32ardilla.png") },
  { numero: 33, nombre: "Pescado", imagen: getAnimalImage("33pescado.png") },
  { numero: 34, nombre: "Venado", imagen: getAnimalImage("34venado.png") },
  { numero: 35, nombre: "Jirafa", imagen: getAnimalImage("35jirafa.png") },
  { numero: 36, nombre: "Culebra", imagen: getAnimalImage("36culebra.png") },
];

// Función helper para obtener un animal por número
export const getAnimalByNumero = (numero: number): Animal | undefined => {
  return animals.find(a => a.numero === numero);
};

// Función helper para obtener un animal por nombre
export const getAnimalByNombre = (nombre: string): Animal | undefined => {
  return animals.find(a => a.nombre.toLowerCase() === nombre.toLowerCase());
};

// Animales principales para la ruleta (los primeros 12)
export const mainAnimals: Animal[] = animals.slice(2, 14); // Desde Carnero (1) hasta Caballo (12)
