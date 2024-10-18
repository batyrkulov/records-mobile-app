import { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SQLiteDatabase } from 'react-native-sqlite-storage';

import Auth from '../screens/Auth';
import Home from '../screens/Home';
import { connectToDatabase, createTables } from '../db/db';

export default function Main() {
  const Stack = createNativeStackNavigator();
  const [db, setDB] = useState<SQLiteDatabase>();

  const loadData = useCallback(async () => {
    try {
      const newDB = await connectToDatabase();
      await createTables(newDB);
      setDB(newDB)
    } catch (error) {
      console.error(error);
    }
  }, [db]);

  useEffect(() => {
    loadData();
  }, []);


  if (!db) return <></>;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={Auth} initialParams={{ db }} />
        <Stack.Screen name="Home" component={Home} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}