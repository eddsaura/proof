import { Linking, StyleProp, Text, TextStyle } from "react-native";

import { ProfileUsername } from "@/components/profile-username";
import { colors } from "@/lib/theme";

const richTextRegex =
  /(\[[^\]\n]+\]\((?:https?:\/\/)?[^)\s]+\)|\*\*[^*\n]+\*\*|\*[^*\n]+\*|@[a-z0-9-]{1,39})/gi;
const linkRegex = /^\[([^\]\n]+)\]\(((?:https?:\/\/)?[^)\s]+)\)$/i;

function normalizeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function MentionText({
  text,
  style,
  numberOfLines,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const segments = text.split(richTextRegex);

  return (
    <Text numberOfLines={numberOfLines} style={style}>
      {segments.map((segment, index) => {
        if (segment.match(/^@[a-z0-9-]{1,39}$/i)) {
          const username = segment.replace("@", "").toLowerCase();
          return (
            <ProfileUsername
              key={`${segment}-${index}`}
              username={username}
              style={{ color: colors.accent }}
            />
          );
        }

        if (segment.match(/^\*\*[^*\n]+\*\*$/)) {
          return (
            <Text key={`${segment}-${index}`} style={{ fontWeight: "800" }}>
              {segment.slice(2, -2)}
            </Text>
          );
        }

        if (segment.match(/^\*[^*\n]+\*$/)) {
          return (
            <Text key={`${segment}-${index}`} style={{ fontStyle: "italic" }}>
              {segment.slice(1, -1)}
            </Text>
          );
        }

        const linkMatch = segment.match(linkRegex);

        if (linkMatch) {
          const [, label, url] = linkMatch;

          return (
            <Text
              key={`${segment}-${index}`}
              style={{
                color: colors.accent,
                fontWeight: "700",
                textDecorationLine: "underline",
              }}
              onPress={() => void Linking.openURL(normalizeUrl(url))}
            >
              {label}
            </Text>
          );
        }

        return segment;
      })}
    </Text>
  );
}
