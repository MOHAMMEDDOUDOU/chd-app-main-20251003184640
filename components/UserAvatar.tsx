import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface UserAvatarProps {
  username: string;
  fullName?: string;
  profileImageUrl?: string;
  size?: number;
  fontSize?: number;
}

const colors = [
  '#FF6B35', // البرتقالي من اللوجو
  '#4ECDC4', // الأزرق من اللوجو
  '#667eea',
  '#f093fb',
  '#f5576c',
  '#4facfe',
  '#00f2fe',
  '#43e97b',
  '#38f9d7',
  '#fa709a',
  '#fee140',
  '#a8edea',
  '#fed6e3',
  '#ffecd2',
  '#fcb69f',
];

export default function UserAvatar({ 
  username, 
  fullName, 
  profileImageUrl,
  size = 40, 
  fontSize = 16 
}: UserAvatarProps) {
  console.log('=== USER AVATAR RENDER ===');
  console.log('UserAvatar props:', { username, fullName, profileImageUrl, size, fontSize });
  
  // إذا كان هناك صورة بروفايل، اعرضها
  if (profileImageUrl) {
    return (
      <Image
        source={{ uri: profileImageUrl }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          }
        ]}
        resizeMode="cover"
      />
    );
  }
  
  // الحصول على الحرف الأول من اسم المستخدم أو الاسم الكامل
  const displayName = fullName || username;
  const firstLetter = displayName.charAt(0).toUpperCase();
  
  console.log('UserAvatar - displayName:', displayName);
  console.log('UserAvatar - firstLetter:', firstLetter);
  
  // اختيار لون عشوائي بناءً على اسم المستخدم
  const colorIndex = username.length % colors.length;
  const backgroundColor = colors[colorIndex];
  
  console.log('UserAvatar - colorIndex:', colorIndex);
  console.log('UserAvatar - backgroundColor:', backgroundColor);

  console.log('UserAvatar - Rendering with:', { firstLetter, backgroundColor, size });
  
  return (
    <View 
      style={[
        styles.avatar, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor 
        }
      ]}
    >
      <Text 
        style={[
          styles.letter, 
          { 
            fontSize: fontSize,
            lineHeight: fontSize
          }
        ]}
      >
        {firstLetter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  letter: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
