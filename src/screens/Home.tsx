import { memo, useCallback, useEffect, useState } from 'react';
import { Modal, TextInput, TouchableWithoutFeedback } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SQLiteDatabase } from 'react-native-sqlite-storage';

import { Comment, RootStackParamList, UserFull } from '../type';
import { addComment, getComments, getCommentsCount } from '../db/db';

export const itemsPerPage = 25;

const Main = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Home'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Home'>>();
  const db: SQLiteDatabase = route.params.db;
  const user: UserFull = route.params.user;

  const [total, setTotal] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState<number>(1);
  const [modalOpenedFor, setModalOpenedFor] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');

  const getSubCommentsRecursively = async (comments: Comment[]): Promise<Comment[]> => {
    for (let i = 0; i < comments.length; i++) {
      const subComments = await getComments(db, 0, 0, comments[i].id);
      comments[i].sub_comments = await getSubCommentsRecursively(subComments);
    }
    return comments;
  }

  const getData = async (offset = 0, limit = itemsPerPage, parent_id: number) => {
    const count = await getCommentsCount(db);
    setTotal(count);
    const comments = await getComments(db, offset, limit, parent_id);
    const newComments = await getSubCommentsRecursively(comments);
    setComments(newComments.reverse());
  }

  useEffect(() => {
    getData((itemsPerPage * (page - 1)), itemsPerPage, 0);
  }, [page]);

  const onCommentAddPress = useCallback(async () => {
    await addComment(db, {
      parent_id: modalOpenedFor as number,
      user_id: user.id,
      content: comment,
    });
    setComment('');
    setModalOpenedFor(null);
    if (modalOpenedFor) {
      getData((itemsPerPage * (page - 1)), itemsPerPage, 0);
    } else {
      if (page === 1) getData(0, itemsPerPage, 0);
      setPage(1);
    }
  }, [db, modalOpenedFor, user, comment]);

  const CommentRecursively = memo(
    ({ comment, level = 0 }: { comment: Comment, level?: number; }): JSX.Element => {
      return (<View key={comment.id}>
        <View style={[
          { paddingLeft: 25 * level, }
        ]}>
          <View style={styles.commentInfoContainer}>
            <Text style={[styles.commentInfoText, styles.name]}>{user.name}</Text>
            <Text style={styles.commentInfoText}>{comment.created_at}</Text>
          </View>
          <Text style={styles.comment}>{comment.content}</Text>
          <TouchableOpacity onPress={() => setModalOpenedFor(comment.id)}>
            <Text style={styles.answer}>Answer</Text>
          </TouchableOpacity>
        </View>
        {!!comment.sub_comments?.length && comment.sub_comments.map(
          sub_comment => <CommentRecursively comment={sub_comment} level={level + 1} />
        )}
      </View>)
    }
  )

  return (<View style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false}>
      {comments.map(comment => (<CommentRecursively comment={comment} />))}
      <View style={styles.space} />
    </ScrollView>
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={styles.pageBaseContainer}
        disabled={page === 1}
        onPress={() => setPage(1)}
      >
        <Text style={[styles.pageBase, page === 1 && styles.pageDisabled]}>{`|<`}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.pageBaseContainer}
        disabled={page === 1}
        onPress={() => setPage(page - 1)}
      >
        <Text style={[styles.pageBase, page === 1 && styles.pageDisabled]}>{`<`}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.pageBaseContainer}
        disabled={true}
      >
        <Text style={styles.pageBase}>{page}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.pageBaseContainer}
        disabled={page === Math.ceil(total / itemsPerPage)}
        onPress={() => setPage(page + 1)}
      >
        <Text style={[
          styles.pageBase,
          page === Math.ceil(total / itemsPerPage) && styles.pageDisabled
        ]}
        >
          {`>`}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.pageBaseContainer}
        disabled={page === Math.ceil(total / itemsPerPage)}
        onPress={() => setPage(Math.ceil(total / itemsPerPage))}
      >
        <Text style={[
          styles.pageBase,
          page === Math.ceil(total / itemsPerPage) && styles.pageDisabled
        ]}
        >
          {`>|`}
        </Text>
      </TouchableOpacity>
    </View>
    <TouchableOpacity
      style={styles.button}
      onPress={() => setModalOpenedFor(0)}
    >
      <Text style={styles.buttonText}>Add record</Text>
    </TouchableOpacity>
    {modalOpenedFor !== null && <Modal
      transparent
      visible={true}
    >
      <TouchableWithoutFeedback onPress={() => setModalOpenedFor(null)}>
        <View style={styles.modalOverlayStyle} />
      </TouchableWithoutFeedback>
      <View style={styles.modalContainerStyle}>
        <TextInput
          multiline
          value={comment}
          onChangeText={text => setComment(text)}
          style={styles.input}
          placeholder='text'
          numberOfLines={9}
          textAlignVertical='top'
        />
        <TouchableOpacity
          style={styles.button}
          onPress={onCommentAddPress}
        >
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </Modal>}
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  commentInfoContainer: {
    backgroundColor: '#174B26',
    flexDirection: 'row',
    height: 45,
    alignItems: 'center',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  commentInfoText: {
    color: 'white',
    fontSize: 15,
  },
  name: {
    fontSize: 20,
  },
  comment: {
    fontSize: 16,
    marginTop: 10,
  },
  answer: {
    marginBottom: 10,
    marginTop: 6,
    alignSelf: 'flex-end'
  },
  space: {
    height: 100,
  },
  modalContainerStyle: {
    width: '90%',
    backgroundColor: 'white',
    alignSelf: 'center',
    marginTop: '25%',
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  modalOverlayStyle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  input: {
    borderWidth: 0.5,
    borderRadius: 10,
    height: 170,
    borderColor: '#174B26',
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  button: {
    marginTop: 20,
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBase: {
    fontSize: 24,
  },
  pageDisabled: {
    color: '#9FA5A6',
  },
  pageBaseContainer: {
    marginHorizontal: 10,
  }
});

export default Main;