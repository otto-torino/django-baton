export const messages = {
  aiApiError: {
    en: 'There was an error while generating the AI response',
    it: 'Si è verificato un errore durante la generazione della risposta AI',
    es: 'Hubo un error al generar la respuesta AI',
  },
  aspectRatio: {
    en: 'Aspect ratio',
    it: 'Formato',
    es: 'Aspecto',
  },
  cannotCopyToClipboardMessage: {
    en: 'Cannot copy to clipboard, please do it manually: Ctrl+C, Enter',
    it: 'Impossibile copiare negli appunti, copiare manualmente: Ctrl+C, Enter',
    es: 'No se puede copiar al portapapeles, por favor copie manualmente: Ctrl+C, Enter',
  },
  close: {
    en: 'Close',
    it: 'Chiudi',
    es: 'Cerrar',
  },
  CorrApiCalls: {
    en: 'Corr API calls',
    it: 'Chiamate correzione',
    es: 'Llamadas de corrección',
  },
  CorrApiCost: {
    en: 'Corr API cost',
    it: 'Costo correzioni',
    es: 'Costo de corrección',
  },
  Correction: {
    en: 'Correction',
    it: 'Correzione',
    es: 'Corrección',
  },
  Cost: {
    en: 'Cost',
    it: 'Costo',
    es: 'Costo',
  },
  Count: {
    en: 'Count',
    it: 'Conteggio',
    es: 'Conteo',
  },
  darkTheme: {
    en: 'Dark theme',
    it: 'Tema scuro',
    es: 'Tema oscuro',
  },
  Date: {
    en: 'Date',
    it: 'Data',
    es: 'Fecha',
  },
  describeImageContent: {
    en: 'Describe the image content',
    it: 'Descrivi il contenuto dell’immagine',
    es: 'Describa el contenido de la imagen',
  },
  Diff: {
    en: 'Diff',
    it: 'Diff',
    es: 'Diff',
  },
  error: {
    en: 'Error',
    it: 'Errore',
    es: 'Error',
  },
  fileName: {
    en: 'File name',
    it: 'Nome del file',
    es: 'Nombre del archivo',
  },
  filter: {
    en: 'Filter',
    it: 'Filtra',
    es: 'Filtrar',
  },
  generate: {
    en: 'Generate',
    it: 'Genera',
    es: 'Generar',
  },
  generateAltText: {
    en: 'Generate alt text',
    it: 'Genera testo alternativo',
    es: 'Generar texto alternativo',
  },
  generateImageFromAI: {
    en: 'Generate image from AI',
    it: 'Genera immagine da AI',
    es: 'Generar imagen desde AI',
  },
  generateSummary: {
    en: 'Summarize in',
    it: 'Riassumi in',
    es: 'Resumen en',
  },
  imageGenerationError: {
    en: 'There was an error generating the image',
    it: 'Si è verificato un errore nella generazione dell’immagine',
    es: 'Hubo un error al generar la imagen',
  },
  ImagesApiCalls: {
    en: 'Images API calls',
    it: 'Chiamate immagini',
    es: 'Llamadas de imagen',
  },
  ImagesApiCost: {
    en: 'Images API cost',
    it: 'Costo immagini',
    es: 'Costo de imagenes',
  },
  lightTheme: {
    en: 'Light theme',
    it: 'Tema chiaro',
    es: 'Tema claro',
  },
  Original: {
    en: 'Original',
    it: 'Originale',
    es: 'Original',
  },
  retrieveDataError: {
    en: 'There was an error retrieving the data',
    it: 'Si è verificato un errore nel reuperare i dati',
    es: 'Hubo un error al recuperar los datos',
  },
  save: {
    en: 'Save',
    it: 'Salva',
    es: 'Guardar',
  },
  search: {
    en: 'Search',
    it: 'Cerca',
    es: 'Buscar',
  },
  SummApiCalls: {
    en: 'Summ API calls',
    it: 'Chiamate riassunto',
    es: 'Llamadas de resumen',
  },
  SummApiCost: {
    en: 'Summ API cost',
    it: 'Costo riassunto',
    es: 'Costo de resumen',
  },
  TotalCost: {
    en: 'Total cost',
    it: 'Costo totale',
    es: 'Costo total',
  },
  TransApiCalls: {
    en: 'Trans API calls',
    it: 'Chiamate traduzione',
    es: 'Llamadas de traducción',
  },
  TransApiCost: {
    en: 'Trans API cost',
    it: 'Costo traduzione',
    es: 'Costo de traducción',
  },
  translate: {
    en: 'Translate',
    it: 'Traduci',
    es: 'Traducir',
  },
  unsavedChangesAlert: {
    en: 'You have some unsaved changes.',
    it: 'Alcune modifiche non sono state salvate.',
    es: 'Tienes algunos cambios sin guardar.',
  },
  uploading: {
    en: 'Uploading...',
    it: 'Uploading...',
    es: 'Cargando...',
  },
  useBulletedList: {
    en: 'Use bulletted list',
    it: 'Usa elenco puntato',
    es: 'Usa lista de viñetas',
  },
  useCorrection: {
    en: 'Use correction',
    it: 'Usa correzione',
    es: 'Usar corrección',
  },
  useImage: {
    en: 'Use image',
    it: 'Usa immagine',
    es: 'Usar imagen',
  },
  VisionApiCalls: {
    en: 'Vision API calls',
    it: 'Chiamate vision',
    es: 'Llamadas de visión',
  },
  VisionApiCost: {
    en: 'Vision API cost',
    it: 'Costo vision',
    es: 'Costo de visión',
  },
  words: {
    en: 'Words',
    it: 'Parole',
    es: 'Palabras',
  },
}

export default class Translator {
  constructor(lng) {
    this.lng = this.setLng(lng)
  }

  setLng(lng) {
    if (lng === 'it' || /it-/.test(lng)) {
      return 'it'
    } else if (lng === 'en' || /en-/.test(lng)) {
      return 'en'
    }

    return lng
  }

  get(key) {
    // check custom translations first
    const b = window.Baton
    if (b.translations && b.translations[key] !== 'undefined') {
      return b.translations[key]
    }

    // if key is not found, return empty string
    if (typeof messages[key] === 'undefined') {
      return ''
    }

    // search localized message
    if (messages[key][this.lng] !== undefined) {
      return messages[key][this.lng]
    }

    // default to english
    return messages[key].en
  }
}
