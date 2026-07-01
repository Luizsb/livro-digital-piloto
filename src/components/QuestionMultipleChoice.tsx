import { MultipleChoiceQuestion, UserAnswers } from '../types/questions';
import { QuestionWrapper } from './shared/QuestionWrapper';
import { COLORS, FONTS } from '../constants/colors';

type ChoiceKey = 'a' | 'b' | 'c';

const KEYS: ChoiceKey[] = ['a', 'b', 'c'];

interface QuestionMultipleChoiceProps {
  question: MultipleChoiceQuestion;
  userAnswers: UserAnswers;
  onAnswerChange: (questionId: string, answer: ChoiceKey) => void;
  showResults?: boolean;
}

function QuestionMultipleChoice({
  question,
  userAnswers,
  onAnswerChange,
  showResults = false,
}: QuestionMultipleChoiceProps) {
  const selectedAnswer = userAnswers[question.id] as ChoiceKey | undefined;
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <QuestionWrapper
      number={question.number}
      question={question.question}
      className="p-4 rounded-lg"
    >
      <div className="space-y-3">
        {KEYS.map((key) => {
          const label = String.fromCharCode(97 + KEYS.indexOf(key));
          return (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-3 rounded p-3 transition-colors ${
                selectedAnswer === key
                  ? 'border-l-4 border-blue-600 bg-blue-100'
                  : 'bg-white hover:bg-blue-50'
              } ${
                showResults && selectedAnswer === key
                  ? isCorrect
                    ? 'border-l-4 border-green-600 bg-green-50'
                    : 'border-l-4 border-red-600 bg-red-50'
                  : ''
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={key}
                checked={selectedAnswer === key}
                onChange={() => onAnswerChange(question.id, key)}
                className="h-4 w-4"
                disabled={showResults}
              />
              <span style={{ fontFamily: FONTS.primary, color: COLORS.text.primary }}>
                <span style={{ color: COLORS.primary, fontWeight: 'bold' }}>{label}) </span>
                {question.options[key]}
              </span>
              {showResults && selectedAnswer === key && (
                <span
                  className={`ml-auto text-sm font-semibold ${
                    isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isCorrect ? '✓ Correto' : '✗ Incorreto'}
                </span>
              )}
            </label>
          );
        })}
      </div>
      {showResults && selectedAnswer !== question.correctAnswer && (
        <p className="mt-3 text-sm text-red-600">
          Resposta correta:{' '}
          <strong>{question.options[question.correctAnswer]}</strong>
        </p>
      )}
    </QuestionWrapper>
  );
}

export default QuestionMultipleChoice;
