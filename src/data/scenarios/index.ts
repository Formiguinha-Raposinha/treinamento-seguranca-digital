import { Scenario } from '../../types/cenario';
import { fakeRelativeScenario } from './golpeFalsoFamiliar';
import { fakeBankLinkScenario } from './golpeLinkBanco';
import { fakeCallCenterScenario } from './golpeFalsaCentral0800';
import { fakeInssScenario } from './golpeProvaVidaInss';
import { fakeMotoboyScenario } from './golpeFalsoMotoboy';
import { fakeDeliveryGiftScenario } from './golpePresenteTaxa';

export const golpeFalsoFamiliar = fakeRelativeScenario;
export const golpeLinkBanco = fakeBankLinkScenario;
export const golpeFalsaCentral0800 = fakeCallCenterScenario;
export const golpeProvaVidaInss = fakeInssScenario;
export const golpeFalsoMotoboy = fakeMotoboyScenario;
export const golpePresenteTaxa = fakeDeliveryGiftScenario;

export const availableScenarios: Scenario[] = [
  golpeFalsoFamiliar,
  golpeLinkBanco,
  golpeFalsaCentral0800,
  golpeProvaVidaInss,
  golpeFalsoMotoboy,
  golpePresenteTaxa
];

export const cenariosDisponiveis = availableScenarios;

export const getScenarioById = (id: string): Scenario | undefined => {
  return availableScenarios.find(s => s.id === id);
};
