import { configure } from '@testing-library/angular';

// Con el conjunto completo en paralelo, la máquina cargada puede tardar más de 1 s
// (el valor por defecto) en mostrar un resultado asíncrono, y `findBy*`/`waitFor`
// fallaban de forma intermitente. Una prueba que pasa no espera más.
// Testing Library para Angular aplica esta opción en cada `render()`.
configure({ dom: { asyncUtilTimeout: 3000 } });
