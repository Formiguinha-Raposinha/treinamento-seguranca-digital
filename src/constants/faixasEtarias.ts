export const FAIXAS_ETARIAS = [
  { value: 'menor-18', label: 'Menos de 18 anos' },
  { value: '18-29', label: '18 a 29 anos' },
  { value: '30-44', label: '30 a 44 anos' },
  { value: '45-59', label: '45 a 59 anos' },
  { value: '60-69', label: '60 a 69 anos' },
  { value: '70-79', label: '70 a 79 anos' },
  { value: '80+', label: '80 anos ou mais' },
  { value: 'nao-informar', label: 'Prefiro não informar' }
] as const;

export const formatarFaixaEtaria = (valor?: string | null): string => {
  if (!valor) return 'Não informada';
  return FAIXAS_ETARIAS.find(f => f.value === valor)?.label || `${valor} anos`;
};
