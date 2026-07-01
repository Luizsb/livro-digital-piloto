import { UserAnswers } from '../types/questions';

interface TableRow {
  id: string;
  [key: string]: string | undefined; // Permite campos dinâmicos
}

interface SubQuestion {
  letter: string;
  question: string;
  placeholder?: string;
  correctAnswer?: string;
}

interface QuestionTableFillProps {
  questionId: string;
  title?: string;
  number?: number;
  columns: string[];
  rows: TableRow[];
  subQuestions?: SubQuestion[];
  userAnswers: UserAnswers;
  onAnswerChange: (questionId: string, fieldId: string, answer: string) => void;
  showResults?: boolean;
}

function QuestionTableFill({
  questionId,
  title,
  number,
  columns,
  rows,
  subQuestions,
  userAnswers,
  onAnswerChange,
  showResults = false,
}: QuestionTableFillProps) {
  const hasLabelColumn = rows.some((row) => Object.prototype.hasOwnProperty.call(row, 'paragraph'));

  return (
    <div className="mb-6">
      {title && (
        <p className="mb-4 font-semibold text-left" style={{ color: 'black' }}>
          {number !== undefined && (
            <span style={{ color: '#00776E', fontWeight: 'bold' }}>{number}. </span>
          )}
          <span style={{ color: 'black' }}>{title}</span>
        </p>
      )}
      <div className="overflow-x-auto mb-6 -mx-4 md:mx-0">
        <div className="min-w-full inline-block">
          <table
            className="w-full border-collapse"
            style={{
              border: '3px solid #80298F',
              minWidth: '100%',
            }}
          >
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`p-2 md:p-3 font-semibold text-xs md:text-base ${index === 0 ? 'text-center' : 'text-center'}`}
                    style={{
                      border: '1px solid #80298F',
                      backgroundColor: '#F9DDFF',
                      color: '#000000',
                      fontFamily: 'Ubuntu, sans-serif',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      textAlign: 'center',
                    }}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                // Mantém a ordem dos campos text1, text2, text3... quando existirem
                const dataFieldKeys = Object.keys(row)
                  .filter((key) => key !== 'id' && key !== 'paragraph')
                  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
                
                return (
                  <tr key={row.id}>
                    {hasLabelColumn && (
                      <td
                        className="p-2 md:p-3 font-semibold text-xs md:text-base text-center"
                        style={{
                          border: '1px solid #80298F',
                          backgroundColor: '#F9DDFF',
                          color: '#000000',
                          fontFamily: 'Ubuntu, sans-serif',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          textAlign: 'center',
                        }}
                      >
                        {row.paragraph || ''}
                      </td>
                    )}
                    {columns
                      .slice(hasLabelColumn ? 1 : 0)
                      .map((_, colIndex) => {
                        const fieldId = `${questionId}_${row.id}_col${colIndex + 1}`;
                        const fieldValue = dataFieldKeys[colIndex] ? row[dataFieldKeys[colIndex]] : '';
                        const userAnswer = (userAnswers[fieldId] as string) || fieldValue || '';
                      
                        return (
                          <td
                            key={colIndex}
                            className="p-2 md:p-3"
                            style={{
                              border: '1px solid #80298F',
                              backgroundColor: 'white',
                            }}
                          >
                            <textarea
                              value={userAnswer}
                              onChange={(e) => onAnswerChange(questionId, fieldId, e.target.value)}
                              placeholder="Digite aqui..."
                              disabled={showResults}
                              className="mt-2 block h-[31px] w-full max-w-full rounded-[5px] bg-[rgba(221,221,221,0.50)] px-3 pt-1 text-left text-[14px] font-normal leading-normal text-[#000000] placeholder:text-[#BDBDBD] font-myriad-vf focus:outline-none resize-none"
                              style={{
                                fontFamily: 'myriad-vf, sans-serif',
                                color: '#000000',
                                border: 'none',
                              }}
                            />
                          </td>
                        );
                      })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Subquestões */}
      {subQuestions && subQuestions.length > 0 && (
        <div className="space-y-4">
          {subQuestions.map((subQ) => {
            const subQuestionId = `${questionId}_${subQ.letter}`;
            const subUserAnswer = (userAnswers[subQuestionId] as string) || '';
            
            return (
              <div key={subQ.letter} className="mb-4">
                <p className="mb-2">
                  <span style={{ color: '#00776E', fontWeight: 'bold' }}>{subQ.letter}) </span>
                  <span style={{ color: 'black' }}>{subQ.question}</span>
                </p>
                <textarea
                  value={subUserAnswer}
                  onChange={(e) => onAnswerChange(questionId, subQuestionId, e.target.value)}
                  placeholder={subQ.placeholder || 'Digite sua resposta aqui...'}
                  disabled={showResults}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[80px] text-black"
                  style={{
                    fontFamily: 'Ubuntu, sans-serif',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default QuestionTableFill;

