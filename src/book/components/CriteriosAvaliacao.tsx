import { UserAnswers } from '@book/types/questions';
import { publicUrl } from '@shared/lib/publicUrl';

interface Criterio {
  id: string;
  nome: string;
  pergunta: string;
}

interface CriteriosAvaliacaoProps {
  title?: string;
  instanceId: string;
  criterios: Criterio[];
  userAnswers?: UserAnswers;
  onAnswerChange?: (criterioId: string, answer: boolean | string) => void;
  emojiImages?: {
    jaSei?: string;
    precisoSaberMais?: string;
    aindaNaoSei?: string;
  };
}

function CriteriosAvaliacao({
  title = '',
  instanceId,
  criterios,
  userAnswers = {},
  onAnswerChange,
  emojiImages,
}: CriteriosAvaliacaoProps) {
  const handleAnswerChange = (criterioId: string, answer: string) => {
    if (onAnswerChange) {
      // Usa instanceId como prefixo para tornar o ID único
      const uniqueId = `${instanceId}_${criterioId}`;
      onAnswerChange(uniqueId, answer);
    }
  };

  const options = [
    {
      id: 'ja-sei',
      label: 'JÁ SEI',
      emoji: emojiImages?.jaSei ?? 'images/page_10_img_102_472.png',
    },
    {
      id: 'preciso-saber-mais',
      label: 'PRECISO SABER MAIS',
      emoji: emojiImages?.precisoSaberMais ?? 'images/page_10_img_189_472.png',
    },
    {
      id: 'ainda-nao-sei',
      label: 'AINDA NÃO SEI',
      emoji: emojiImages?.aindaNaoSei ?? 'images/page_10_img_358_472.png',
    },
  ] as const;

  return (
    <div className="my-8">
      <h3 className="mb-6 text-center text-base font-bold text-[#BF3154] md:text-lg">{title}</h3>

      <div className="mb-8 grid grid-cols-[auto_1fr_1fr_1fr] items-start gap-4 md:gap-6">
        <div />
        {options.map((option) => (
          <div key={option.id} className="flex flex-col items-center gap-2 text-center">
            <img
              src={publicUrl(option.emoji)}
              alt={option.label}
              className="h-10 w-10 object-contain md:h-12 md:w-12"
            />
            <p className="text-xs tracking-wide text-black md:text-sm">{option.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {criterios.map((criterio) => {
          const uniqueId = `${instanceId}_${criterio.id}`;
          const answer = userAnswers[uniqueId] as string | boolean | undefined;

          return (
            <div key={criterio.id} className="grid grid-cols-[auto_1fr] items-start gap-4 md:gap-6">
              <div className="grid grid-cols-3 gap-3 md:gap-5">
                {options.map((option) => (
                  <label key={option.id} className="flex items-center justify-center gap-2">
                    <input
                      type="radio"
                      name={uniqueId}
                      checked={answer === option.id}
                      onChange={() => handleAnswerChange(criterio.id, option.id)}
                      className="h-4 w-4 md:h-5 md:w-5"
                      style={{ accentColor: '#80298F' }}
                    />
                    <img
                      src={publicUrl(option.emoji)}
                      alt={option.label}
                      className="h-8 w-8 object-contain md:h-10 md:w-10"
                    />
                  </label>
                ))}
              </div>

              <p className="criterio-pergunta">{criterio.pergunta}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CriteriosAvaliacao;

