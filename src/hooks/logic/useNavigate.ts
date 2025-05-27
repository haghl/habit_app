import {TRootStackParamList} from '@/navigation/types';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

const useNavigate = (): StackNavigationProp<TRootStackParamList> => {
  const navigation = useNavigation<StackNavigationProp<TRootStackParamList>>();
  return navigation;
};

export default useNavigate;
