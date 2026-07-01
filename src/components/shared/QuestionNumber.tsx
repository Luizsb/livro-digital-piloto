import { COLORS } from '../../constants/colors';

interface QuestionNumberProps {
  number?: number;
  letter?: string;
  className?: string;
}

/**
 * Componente reutilizável para renderizar número/letra de questão
 */
export function QuestionNumber({ number, letter, className = '' }: QuestionNumberProps) {
  if (number !== undefined) {
    return (
      <span style={{ color: COLORS.primary, fontWeight: 'bold' }} className={className}>
        {number}.{' '}
      </span>
    );
  }

  if (letter) {
    return (
      <span style={{ color: COLORS.primary, fontWeight: 'bold' }} className={className}>
        {letter}){' '}
      </span>
    );
  }

  return null;
}

