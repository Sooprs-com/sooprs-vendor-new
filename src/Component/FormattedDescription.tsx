import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import {prepareContent} from './formattedHtml';

type InlineNode = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

type DescriptionBlock =
  | {type: 'paragraph'; inlines: InlineNode[]}
  | {type: 'heading'; level: number; inlines: InlineNode[]}
  | {type: 'list'; ordered: boolean; items: InlineNode[][]};

type Props = {
  value?: string | null;
  baseStyle?: StyleProp<TextStyle>;
  fallback?: string;
  collapsed?: boolean;
  collapsedLines?: number;
  onOverflowChange?: (overflows: boolean) => void;
};

function descriptionPlainText(prepared: {
  isHtml: boolean;
  text: string;
  blocks: DescriptionBlock[];
}) {
  if (!prepared.isHtml) {
    return prepared.text;
  }
  return prepared.blocks
    .map(block => {
      if (block.type === 'list') {
        return block.items.map(item => item.map(node => node.text).join('')).join('\n');
      }
      return block.inlines.map(node => node.text).join('');
    })
    .join('\n');
}

function isLongerThanLines(text: string, lineLimit: number) {
  const parts = text.replace(/\r/g, '').split('\n');
  let lines = 0;
  parts.forEach(part => {
    const length = part.trim().length;
    if (length === 0) {
      return;
    }
    lines += Math.max(1, Math.ceil(length / 42));
  });
  return lines > lineLimit;
}

function inlineStyle(node: InlineNode): TextStyle {
  return {
    fontWeight: node.bold ? '700' : undefined,
    fontStyle: node.italic ? 'italic' : undefined,
    textDecorationLine: node.underline ? 'underline' : undefined,
  };
}

function InlineText({nodes}: {nodes: InlineNode[]}) {
  return (
    <>
      {nodes.map((node, index) => (
        <Text key={`${index}-${node.text.slice(0, 12)}`} style={inlineStyle(node)}>
          {node.text}
        </Text>
      ))}
    </>
  );
}

const FormattedDescription = ({
  value,
  baseStyle,
  fallback = '',
  collapsed = false,
  collapsedLines = 5,
  onOverflowChange,
}: Props) => {
  const prepared = useMemo(() => prepareContent(value), [value]);
  const flat = StyleSheet.flatten(baseStyle) || {};
  const fontSize = typeof flat.fontSize === 'number' ? flat.fontSize : 14;
  const lineHeight =
    typeof flat.lineHeight === 'number' ? flat.lineHeight : Math.round(fontSize * 1.45);
  const [lineCount, setLineCount] = useState(0);
  const onOverflowChangeRef = useRef(onOverflowChange);
  onOverflowChangeRef.current = onOverflowChange;

  const preview = descriptionPlainText(prepared);
  const textOverflows = isLongerThanLines(preview, collapsedLines);
  const overflows = lineCount > 0 ? lineCount > collapsedLines : textOverflows;
  const showCollapsedPreview = collapsed && overflows;

  useEffect(() => {
    onOverflowChangeRef.current?.(overflows);
  }, [overflows]);

  if (!prepared.isHtml && !prepared.text.trim()) {
    if (!fallback) {
      return null;
    }
    return <Text style={baseStyle}>{fallback}</Text>;
  }

  const body = prepared.isHtml ? (
    <View>
      {(prepared.blocks as DescriptionBlock[]).map((block, index) => {
        const isLast = index === prepared.blocks.length - 1;
        if (block.type === 'list') {
          return (
            <View key={`list-${index}`} style={[styles.list, isLast && styles.lastBlock]}>
              {block.items.map((item, itemIndex) => (
                <View key={`item-${itemIndex}`} style={styles.listItem}>
                  <Text style={[baseStyle, styles.bullet]}>
                    {block.ordered ? `${itemIndex + 1}.` : '•'}
                  </Text>
                  <Text style={[baseStyle, styles.listText]}>
                    <InlineText nodes={item} />
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === 'heading') {
          const scale = block.level <= 1 ? 1.45 : block.level === 2 ? 1.28 : 1.16;
          return (
            <Text
              key={`heading-${index}`}
              style={[
                baseStyle,
                styles.heading,
                {
                  fontSize: fontSize * scale,
                  lineHeight: lineHeight * scale,
                  marginBottom: isLast ? 0 : 6,
                },
              ]}>
              <InlineText nodes={block.inlines} />
            </Text>
          );
        }

        return (
          <Text
            key={`paragraph-${index}`}
            style={[baseStyle, !isLast && styles.paragraph]}>
            <InlineText nodes={block.inlines} />
          </Text>
        );
      })}
    </View>
  ) : (
    <Text style={baseStyle}>{prepared.text}</Text>
  );

  return (
    <View style={styles.wrap}>
      <Text
        accessible={false}
        style={[baseStyle, styles.measure]}
        onTextLayout={event => {
          const next = event.nativeEvent.lines?.length || 0;
          setLineCount(prev => (prev === next ? prev : next));
        }}>
        {preview}
      </Text>
      {showCollapsedPreview ? (
        <Text style={baseStyle} numberOfLines={collapsedLines} ellipsizeMode="clip">
          {preview}
        </Text>
      ) : (
        body
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  measure: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  paragraph: {
    marginBottom: 8,
  },
  heading: {
    fontWeight: '700',
  },
  lastBlock: {
    marginBottom: 0,
  },
  list: {
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    minWidth: 18,
    marginRight: 6,
  },
  listText: {
    flex: 1,
  },
});

export default FormattedDescription;
