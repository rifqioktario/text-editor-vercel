import { BLOCK_TYPES } from "../../constants/BLOCK_TYPES";
import { ParagraphBlock } from "./blocks/ParagraphBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { TaskBlock } from "./blocks/TaskBlock";
import { QuoteBlock } from "./blocks/QuoteBlock";
import { DividerBlock } from "./blocks/DividerBlock";
import { CodeBlock } from "./blocks/CodeBlock";
import { cn } from "../../utils/cn";

/**
 * Block - Wrapper component that renders the appropriate block type
 */
export function Block({
    block,
    isActive,
    isFirstBlock,
    isSingleBlock,
    onContentChange,
    onPropertiesChange,
    onKeyDown,
    onFocus
}) {
    const { id, type, content, properties } = block;

    // Render the appropriate block component based on type
    const renderBlock = () => {
        // Only show placeholder on first block when it's the only block
        const showPlaceholder = isFirstBlock && isSingleBlock;

        const commonProps = {
            id,
            content,
            properties,
            isActive,
            showPlaceholder,
            onContentChange,
            onPropertiesChange,
            onKeyDown,
            onFocus
        };

        switch (type) {
            case BLOCK_TYPES.PARAGRAPH:
                return <ParagraphBlock {...commonProps} />;

            case BLOCK_TYPES.HEADING_1:
            case BLOCK_TYPES.HEADING_2:
            case BLOCK_TYPES.HEADING_3:
                return <HeadingBlock {...commonProps} type={type} />;

            case BLOCK_TYPES.TASK:
                return <TaskBlock {...commonProps} />;

            case BLOCK_TYPES.QUOTE:
                return <QuoteBlock {...commonProps} />;

            case BLOCK_TYPES.DIVIDER:
                return (
                    <DividerBlock
                        id={id}
                        isActive={isActive}
                        onFocus={onFocus}
                    />
                );

            case BLOCK_TYPES.CODE:
                return <CodeBlock {...commonProps} />;

            // TODO: Add more block types
            case BLOCK_TYPES.IMAGE:
            case BLOCK_TYPES.LINK:
                return (
                    <div className="p-2 bg-gray-100 rounded text-sm text-gray-500">
                        {type} block (coming soon)
                    </div>
                );

            default:
                return <ParagraphBlock {...commonProps} />;
        }
    };

    // Calculate indent padding (each level is 24px)
    const indentLevel = properties?.indent || 0;
    const indentStyle =
        indentLevel > 0 ? { paddingLeft: `${indentLevel * 24}px` } : {};

    return (
        <div
            className={cn(
                "relative group",
                "py-0.5",
                "transition-all duration-150"
            )}
            data-block-id={id}
            style={indentStyle}
        >
            {renderBlock()}
        </div>
    );
}
