import { FillBlanksQuestion, UserAnswers } from '../types/questions';

interface QuestionFillBlanksProps {
  question: FillBlanksQuestion;
  userAnswers: UserAnswers;
  onAnswerChange: (questionId: string, answer: string) => void;
  showResults?: boolean;
}

function QuestionFillBlanks({
  question,
  userAnswers,
  onAnswerChange,
  showResults = false,
}: QuestionFillBlanksProps) {
  return (
    <div className="mb-6">
      <p className="mb-4 text-black">
        {question.number !== undefined && (
          <span className="font-bold text-[#80298F]">{question.number}. </span>
        )}
        <span dangerouslySetInnerHTML={{ __html: question.question }} />
      </p>

      <ul className="ml-0 list-none space-y-4">
        {question.items.map((item) => (
          <li key={item.letter} className="text-black">
            <span className="mr-2 font-bold text-[#80298F]">{item.letter})</span>
            {item.fragments.map((fragment, index) => {
              const blankId = `${question.id}_${item.letter}_${index}`;
              const typedValue = (userAnswers[blankId] as string) || '';
              const expectedValue = item.correctAnswers?.[index] || '';
              const value = showResults && expectedValue ? expectedValue : typedValue;
              const placeholder = item.placeholders?.[index] || '';
              const isLastFragment = index === item.fragments.length - 1;

              return (
                <span key={`${item.letter}_${index}`}>
                  <span>{fragment}</span>
                  {!isLastFragment && (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => onAnswerChange(blankId, e.target.value)}
                      disabled={showResults}
                      placeholder={placeholder}
                      className="mx-1 inline-block h-[31px] w-[180px] max-w-full rounded-[5px] bg-[rgba(221,221,221,0.50)] px-3 pt-1 align-middle text-left text-[14px] font-normal leading-normal text-[#000000] placeholder:text-[#BDBDBD] font-myriad-vf focus:outline-none"
                    />
                  )}
                </span>
              );
            })}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default QuestionFillBlanks;
