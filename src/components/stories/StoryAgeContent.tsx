'use client';

import type { AgeTier } from '@/lib/stories/age-tiers';
import { AudioPill } from '@/components/stories/AudioPill';
import { InteractiveWord } from '@/components/stories/InteractiveWord';
import type { StoryAudioPlayRequest } from '@/lib/stories/audio-play';

interface StoryAgeContentProps {
  tier: AgeTier;
  onPlayAudio: (request: StoryAudioPlayRequest) => void;
}

export function StoryAgeContent({ tier, onPlayAudio }: StoryAgeContentProps) {
  if (tier === '3-5') {
    return (
      <div className="font-story space-y-6 text-tinta text-lg md:text-xl leading-relaxed">
        <p>
          Era uma vez, no céu muito azul, uma{' '}
          <InteractiveWord
            blockKey="demo-3-5-star"
            kind="sfx"
            audioTitle="estrela"
            audioDescription="Efeito sonoro"
            onPlay={onPlayAudio}
          >
            estrela
          </InteractiveWord>{' '}
          muito brilhante! Ela piscava assim:{' '}
          <InteractiveWord
            blockKey="demo-3-5-twinkle"
            kind="sfx"
            audioTitle="Plim-plim da estrela"
            audioDescription="Efeito sonoro"
            onPlay={onPlayAudio}
          >
            plim, plim!
          </InteractiveWord>
        </p>
        <p>
          Um bebezinho muito especial nasceu. O nome dele era{' '}
          <InteractiveWord
            variant="vida"
            blockKey="demo-3-5-jesus"
            kind="sfx"
            audioTitle="Jesus"
            audioDescription="Efeito sonoro"
            onPlay={onPlayAudio}
          >
            Jesus
          </InteractiveWord>
          .
        </p>
        <p>Três amigos viram a luz e caminharam felizes para dar um abraço no bebê!</p>
      </div>
    );
  }

  if (tier === '6-8') {
    return (
      <div className="font-story space-y-6 text-tinta text-lg md:text-xl leading-relaxed">
        <p>
          Depois que Jesus nasceu em Belém, uma{' '}
          <InteractiveWord
            blockKey="demo-6-8-star"
            kind="sfx"
            audioTitle="estrela"
            audioDescription="Efeito sonoro"
            onPlay={onPlayAudio}
          >
            estrela
          </InteractiveWord>{' '}
          muito especial apareceu no céu e guiou uns sábios de terras distantes.
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-2">
          <AudioPill
            label="Brilho da estrela guia"
            variant="efeito"
            blockKey="demo-6-8-star-glow"
            onPlay={onPlayAudio}
            audioTitle="Brilho da estrela guia"
          />
          <AudioPill
            label="Caminhada dos magos"
            variant="ambiente"
            blockKey="demo-6-8-magi-walk"
            onPlay={onPlayAudio}
            audioTitle="Caminhada dos magos"
          />
        </p>
        <p>
          Eles seguiram a estrela até encontrar o menino{' '}
          <InteractiveWord
            variant="vida"
            blockKey="demo-6-8-jesus"
            kind="sfx"
            audioTitle="Jesus"
            audioDescription="Efeito sonoro"
            onPlay={onPlayAudio}
          >
            Jesus
          </InteractiveWord>
          , que estava com Maria e José.
        </p>
        <p>
          Os magos se ajoelharam, deram presentes e adoraram. Era um momento de alegria e
          esperança para o mundo!
        </p>
      </div>
    );
  }

  return (
    <div className="font-story space-y-6 text-tinta text-lg md:text-xl leading-relaxed">
      <p>
        Depois do nascimento de Jesus em Belém da Judéia, nos dias do rei Herodes, magos do Oriente
        chegaram a Jerusalém perguntando: <em>&ldquo;Onde está o recém-nascido rei dos judeus? Vimos
        a sua estrela no Oriente e viemos adorá-lo.&rdquo;</em>
      </p>
      <p>
        <AudioPill
          label="Ambiente: noite no deserto"
          variant="ambiente"
          blockKey="demo-9-11-desert-night"
          onPlay={onPlayAudio}
          audioTitle="Noite no deserto"
        />
      </p>
      <p>
        A estrela que tinham visto no Oriente ia adiante deles até parar sobre o lugar onde estava o
        menino. Ao verem a estrela, ficaram cheios de alegria.
      </p>
      <p>
        Entraram na casa, viram o menino com Maria, sua mãe, e se prostraram em adoração. Abriram
        seus tesouros e lhe ofereceram ouro, incenso e mirra.
      </p>
      <p>
        <em>
          &ldquo;E, tendo sido avisados em sonho para não voltarem a Herodes, regressaram à sua terra
          por outro caminho.&rdquo;
        </em>
      </p>
    </div>
  );
}
