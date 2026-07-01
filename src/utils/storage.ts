import { UserAnswers } from '../types/questions';

const STORAGE_KEY = 'book_answers';

export function saveAnswers(answers: UserAnswers): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (error) {
    console.error('Erro ao salvar respostas:', error);
  }
}

export function loadAnswers(): UserAnswers {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Erro ao carregar respostas:', error);
    return {};
  }
}

export function clearAnswers(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao limpar respostas:', error);
  }
}
