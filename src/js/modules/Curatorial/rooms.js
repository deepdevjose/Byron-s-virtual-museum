export const ROOM_SEQUENCE = [
    'Una obra que nos permite recuperar lo sagrado',
    'Abstracción y figuración',
    'Color, textura y profundidad',
    'Mujeres, ritual y sensualidad',
    'Luz y lo invisible',
    'Paisaje y espacio interior',
    'La tecnología como recurso curatorial'
];

export const ROOM_TEXTS = {
    'Una obra que nos permite recuperar lo sagrado': 'La visita comienza con la pintura como umbral: un lugar donde materia, color, voz y memoria recuperan lo sagrado.',
    'Abstracción y figuración': 'Aquí, el cuerpo no desaparece dentro de la geometría. Es transformado por ella.',
    'Color, textura y profundidad': 'El color se vuelve estructura, presión y temperatura emocional; la textura mantiene la imagen cerca de la mano.',
    'Mujeres, ritual y sensualidad': 'La figura femenina aparece como ternura, sensualidad, ceremonia y presencia simbólica.',
    'Luz y lo invisible': 'La luz no es decoración aquí. Revela aquello que el ojo casi no alcanza a ver.',
    'Paisaje y espacio interior': 'El paisaje se vuelve arquitectura interior, un paso entre tierra, memoria y emoción.',
    'La tecnología como recurso curatorial': 'El código, el audio, el movimiento y la luz se vuelven recursos interpretativos, no solo herramientas de exhibición.'
};

export function getRoomRank(roomName) {
    const index = ROOM_SEQUENCE.indexOf(roomName);
    return index === -1 ? ROOM_SEQUENCE.length : index;
}
