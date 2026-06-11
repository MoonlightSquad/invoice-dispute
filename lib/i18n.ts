import en from '@/dictionaries/en.json'
import uk from '@/dictionaries/uk.json'

const dictionaries = { en, uk } as const

export type Lang = keyof typeof dictionaries
export type Dictionary = typeof en

export function getDictionary(lang: string): Dictionary {
    return dictionaries[(lang as Lang)] ?? dictionaries.en
}