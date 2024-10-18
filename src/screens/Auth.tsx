import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { StackNavigationProp } from '@react-navigation/stack';

import { addUser, getUsers } from '../db/db';
import { RootStackParamList, UserFull } from '../type';


const Auth = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Home'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Auth'>>();
  const db: SQLiteDatabase = route.params.db;

  const [user, setUser] = useState<UserFull>();
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');

  const loadUserData = async () => {
    try {
      const users = await getUsers(db)
      if (users.length) {
        setUser(users[0])
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      navigation.navigate('Home', { db, user });
    }
  }, [user]);

  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const onCreate = async () => {
    if (isValidEmail(email)) {
      await addUser(db, { email, name, });
      loadUserData();
    } else {
      Alert.alert('Please, enter correct email!');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Let's create a new user!</Text>
      <TextInput
        value={email}
        onChangeText={text => setEmail(text)}
        style={styles.input}
        placeholder='Email'
      />
      <TextInput
        value={name}
        onChangeText={text => setName(text)}
        style={styles.input}
        placeholder='Name'
      />
      <TouchableOpacity
        style={styles.button}
        onPress={onCreate}
        disabled={!name.length || !email.length}
      >
        <Text
          style={[
            styles.buttonText,
            (!name.length || !email.length) && styles.buttonTextDisabled,
          ]}>
          Create
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    color: '#33A450',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 0.5,
    borderRadius: 10,
    height: 44,
    borderColor: '#174B26',
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  button: {
    backgroundColor: '#174B26',
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
    color: 'white',
  },
  buttonTextDisabled: {
    color: '#dfdfdf',
  }
});

export default Auth;