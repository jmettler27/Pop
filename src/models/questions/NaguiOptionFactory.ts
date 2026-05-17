import { DuoNaguiOption, HideNaguiOption, NaguiOption, SquareNaguiOption } from '@/models/questions/nagui';

export default class NaguiOptionFactory {
  static createNaguiOption(option: string): typeof NaguiOption | undefined {
    switch (option) {
      case HideNaguiOption.TYPE:
        return HideNaguiOption;
      case SquareNaguiOption.TYPE:
        return SquareNaguiOption;
      case DuoNaguiOption.TYPE:
        return DuoNaguiOption;
    }
  }
}
