import type {
  BiblePassageText,
  BibleTextProvider,
  FetchPassageParams,
} from '@/lib/providers/interfaces/bible-text.provider';

/**
 * Offline fallback for local development without YouVersion key.
 * Uses curated snippets when available; otherwise builds a placeholder.
 */
const CURATED: Record<string, string[]> = {
  'MAT.1': [
    'Livro da genealogia de Jesus Cristo, filho de Davi, filho de Abraão.',
    'Abraão gerou Isaque; Isaque gerou Jacó; Jacó gerou Judá e seus irmãos;',
    'Judá gerou Perez e Zerá, cuja mãe foi Tamar; Perez gerou Esrom; Esrom gerou Arão;',
    'Arão gerou Aminadabe; Aminadabe gerou Naassom; Naassom gerou Salmom;',
    'Salmom gerou Boaz, cuja mãe foi Raabe; Boaz gerou Obede, cuja mãe foi Rute; Obede gerou Jessé;',
    'Jessé gerou o rei Davi; Davi gerou Salomão, cuja mãe foi a que tinha sido mulher de Urias;',
    'Salomão gerou Roboão; Roboão gerou Abias; Abias gerou Asa;',
    'Asa gerou Josafá; Josafá gerou Jorão; Jorão gerou Uzias;',
    'Uzias gerou Jotão; Jotão gerou Acaz; Acaz gerou Ezequias;',
    'Ezequias gerou Manassés; Manassés gerou Amom; Amom gerou Josias;',
    'Josias gerou Jeconias e seus irmãos, no tempo do exílio na Babilônia.',
    'Depois do exílio na Babilônia, Jeconias gerou Salatiel; Salatiel gerou Zorobabel;',
    'Zorobabel gerou Abiúde; Abiúde gerou Eliaquim; Eliaquim gerou Azor;',
    'Azor gerou Sadoque; Sadoque gerou Aquim; Aquim gerou Eliúde;',
    'Eliúde gerou Eleazar; Eleazar gerou Matã; Matã gerou Jacó;',
    'Jacó gerou José, marido de Maria, da qual nasceu Jesus, que se chama o Cristo.',
    'Assim, todas as gerações, desde Abraão até Davi, são catorze gerações; desde Davi até o exílio na Babilônia, catorze gerações; desde o exílio na Babilônia até o Cristo, catorze gerações.',
    'O nascimento de Jesus Cristo foi assim: Estando Maria, sua mãe, prometida em casamento a José, antes de se unirem, achou-se grávida pelo Espírito Santo.',
    'José, seu marido, como era justo e não queria difamá-la, resolveu deixá-la secretamente.',
    'Estando ele pensando nisto, eis que lhe apareceu em sonho um anjo do Senhor, dizendo: José, filho de Davi, não temas receber Maria, tua mulher, pois o que nela foi gerado é do Espírito Santo.',
  ],
  'MAT.2': [
    'E, tendo nascido Jesus em Belém de Judeia, no tempo do rei Herodes, eis que uns magos vieram do oriente a Jerusalém.',
    'Dizendo: Onde está aquele que é nascido rei dos judeus? Porque vimos a sua estrela no oriente, e viemos a adorá-lo.',
    'E o rei Herodes, ouvindo isto, perturbou-se, e toda a Jerusalém com ele.',
  ],
  'GAL.1': [
    'Paulo, apóstolo (não da parte dos homens, nem por intermédio de homem algum, mas por Jesus Cristo, e por Deus Pai, que o ressuscitou dentre os mortos),',
    'e todos os irmãos que estão comigo, às igrejas da Galácia:',
    'graça a vós, e paz da parte de Deus nosso Pai, e do Senhor Jesus Cristo,',
    'o qual se deu a si mesmo por nossos pecados, para nos livrar do presente século mau, segundo a vontade de nosso Deus e Pai,',
    'a quem seja a glória para todo o sempre. Amém.',
    'Admiro-me de que tão depressa estejais transviando-vos daquele que vos chamou pela graça de Cristo para outro evangelho;',
    'o qual não é outro; senão que há alguns que vos inquietam, e querem transtornar o evangelho de Cristo.',
    'Mas, ainda que nós ou um anjo do céu vos anuncie outro evangelho além do que já vos tenho anunciado, seja anátema.',
    'Assim, como já vo-lo dissemos, agora de novo também vo-lo digo: Se algum vos anunciar outro evangelho além do que já recebestes, seja anátema.',
    'Pois, busco eu agora a aprovação dos homens ou a de Deus? ou procuro agradar aos homens? Porque, se ainda agradasse aos homens, não seria servo de Cristo.',
    'Mas faço-vos saber, irmãos, que o evangelho que por mim foi anunciado não é segundo os homens.',
    'Porque não o recebi de homem algum, nem o aprendi, mas o recebi pela revelação de Jesus Cristo.',
    'Porque já ouvistes qual foi antigamente o meu procedimento no judaísmo, como sobremaneira perseguia a igreja de Deus e a assolava,',
    'e progressava no judaísmo além de muitos da minha nação, sendo mais excessivamente zeloso das tradições de meus pais.',
    'Mas, quando aprouve a Deus, que desde o ventre de minha mãe me separou, e me chamou pela sua graça,',
    'revelar seu Filho em mim, para que o evangelizasse entre os gentios, não consultei a carne nem o sangue,',
    'nem subi a Jerusalém para estar com os que já antes de mim eram apóstolos, mas parti para a Arábia, e voltei outra vez a Damasco.',
    'Depois, passados três anos, subi a Jerusalém para ver a Pedro, e fiquei com ele quinze dias;',
    'e não vi a nenhum outro dos apóstolos, senão a Tiago, irmão do Senhor.',
    'Ora, acerca das coisas que vos escrevo, diante de Deus testifico que não minto.',
  ],
};

const STUB_VERSE_PATTERN = /^\[Texto stub /;

export function isStubVerseText(text: string): boolean {
  return STUB_VERSE_PATTERN.test(text.trim());
}

export class StubBibleTextProvider implements BibleTextProvider {
  async fetchPassage(params: FetchPassageParams): Promise<BiblePassageText> {
    const key = `${params.bookCode}.${params.chapter}`;
    const all = CURATED[key] ?? [];
    const selected = all.slice(params.verseFrom - 1, params.verseTo);

    const verses =
      selected.length > 0
        ? selected.map((text, i) => ({ number: params.verseFrom + i, text }))
        : Array.from({ length: params.verseTo - params.verseFrom + 1 }, (_, i) => ({
            number: params.verseFrom + i,
            text: `[Texto stub ${params.bookCode} ${params.chapter}:${params.verseFrom + i}]`,
          }));

    return {
      bibleVersionId: params.bibleVersionId,
      reference: `${params.bookCode} ${params.chapter}:${params.verseFrom}–${params.verseTo}`,
      verses,
      rawText: verses.map((v) => v.text).join(' '),
    };
  }

  async listVersions() {
    return [
      {
        id: '3254',
        name: 'Bíblia Livre Para Todos',
        abbreviation: 'BLT',
      },
    ];
  }
}
