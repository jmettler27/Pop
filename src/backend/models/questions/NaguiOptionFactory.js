import { DuoNaguiOption, HideNaguiOption, SquareNaguiOption } from '@/backend/models/questions/Nagui';

export default class NaguiOptionFactory {
  static createNaguiOption(option) {
    switch (option) {
      case 'hide':
        return HideNaguiOption
      case 'square':
        return SquareNaguiOption
      case 'duo':
        return DuoNaguiOption
    }
  }
}