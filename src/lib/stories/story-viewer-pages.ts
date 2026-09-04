export type InteractiveWordVariant = 'default' | 'vida';

export type StoryTextPart =
  | { type: 'text'; value: string }
  | { type: 'em'; value: string }
  | { type: 'word'; value: string; variant?: InteractiveWordVariant; ariaLabel?: string };

export type StoryParagraph = StoryTextPart[];

export type StoryViewerPage = {
  paragraphs: StoryParagraph[];
};

export const A_ESTRELA_DE_MATEUS_PAGES: StoryViewerPage[] = [
  {
    paragraphs: [
      [
        { type: 'text', value: 'Era uma vez, no céu muito azul, uma ' },
        { type: 'word', value: 'estrela', ariaLabel: 'Ouvir: estrela' },
        { type: 'text', value: ' muito brilhante! Ela piscava assim: ' },
        { type: 'em', value: 'plim, plim!' },
      ],
      [
        { type: 'text', value: 'A estrela queria mostrar um caminho cheio de amor e luz para todos.' },
      ],
    ],
  },
  {
    paragraphs: [
      [
        { type: 'text', value: 'Um bebezinho muito especial nasceu em uma casinha humilde. O nome dele era ' },
        { type: 'word', value: 'Jesus', variant: 'vida', ariaLabel: 'Ouvir: Jesus' },
        { type: 'text', value: '.' },
      ],
      [
        { type: 'text', value: 'Três amigos viram a luz e caminharam felizes para dar um abraço no bebê!' },
      ],
    ],
  },
  {
    paragraphs: [
      [
        { type: 'text', value: 'Os três amigos seguiram a ' },
        { type: 'word', value: 'estrela', ariaLabel: 'Ouvir: estrela' },
        { type: 'text', value: ' por montes e vales, sempre com o coração alegre.' },
      ],
      [
        { type: 'text', value: 'Até encontrar o bebê ' },
        { type: 'word', value: 'Jesus', variant: 'vida', ariaLabel: 'Ouvir: Jesus' },
        { type: 'text', value: ', dormindo tranquilo numa manjedoura cheia de luz.' },
      ],
    ],
  },
  {
    paragraphs: [
      [
        { type: 'text', value: 'Eles deram presentes especiais e cantaram com muita alegria!' },
      ],
      [
        { type: 'text', value: 'A ' },
        { type: 'word', value: 'estrela', ariaLabel: 'Ouvir: estrela' },
        { type: 'text', value: ' continuou brilhando no céu, lembrando a todos do amor de Deus.' },
      ],
      [
        { type: 'text', value: 'E assim, a história da ' },
        { type: 'word', value: 'estrela', ariaLabel: 'Ouvir: estrela' },
        { type: 'text', value: ' de Mateus nos convida a seguir a luz também!' },
      ],
    ],
  },
];

export function getStoryPages(storyId: string): StoryViewerPage[] | null {
  if (storyId === '1') return A_ESTRELA_DE_MATEUS_PAGES;
  return null;
}
