import { router } from "expo-router";
import { Text, TextStyle } from "react-native";

import { colors } from "@/lib/theme";

const mentionRegex = /(@[a-z0-9-]{1,39})/gi;

export function MentionText({
  text,
  style,
}: {
  text: string;
  style?: TextStyle;
}) {
  const segments = text.split(mentionRegex);

  return (
    <Text style={style}>
      {segments.map((segment, index) => {
        if (segment.match(/^@[a-z0-9-]{1,39}$/i)) {
          const username = segment.replace("@", "").toLowerCase();
          return (
            <Text
              key={`${segment}-${index}`}
              style={{ color: colors.accent, fontWeight: "700" }}
              onPress={() =>
                router.push({
                  pathname: "/(protected)/member/[username]",
                  params: { username },
                })
              }
            >
              {segment}
            </Text>
          );
        }

        return segment;
      })}
    </Text>
  );
}
