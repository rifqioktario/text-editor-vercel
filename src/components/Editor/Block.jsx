import { BLOCK_TYPES } from "../../constants/BLOCK_TYPES";
import { ParagraphBlock } from "./blocks/ParagraphBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { TaskBlock } from "./blocks/TaskBlock";
import { QuoteBlock } from "./blocks/QuoteBlock";
import { DividerBlock } from "./blocks/DividerBlock";
import { SectionBlock } from "./blocks/SectionBlock";
import { GalleryBlock } from "./blocks/GalleryBlock";
import { ColumnsBlock } from "./blocks/ColumnsBlock";
import { TabsBlock } from "./blocks/TabsBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { LinkBlock } from "./blocks/LinkBlock";
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
                        onKeyDown={onKeyDown}
                    />
                );

            case BLOCK_TYPES.SECTION:
                return (
                    <SectionBlock
                        block={block}
                        isActive={isActive}
                        onFocus={onFocus}
                        onKeyDown={onKeyDown}
                        onUpdate={(updatedBlock) => {
                            onPropertiesChange?.(updatedBlock.properties);
                        }}
                    />
                );

            case BLOCK_TYPES.GALLERY:
                return (
                    <GalleryBlock
                        block={block}
                        isActive={isActive}
                        onFocus={onFocus}
                        onKeyDown={onKeyDown}
                        onUpdate={(updatedBlock) => {
                            onPropertiesChange?.(id, updatedBlock.properties);
                        }}
                    />
                );

            case BLOCK_TYPES.COLUMNS:
                return (
                    <ColumnsBlock
                        block={block}
                        isActive={isActive}
                        onFocus={onFocus}
                        onKeyDown={onKeyDown}
                        onUpdate={(updatedBlock) => {
                            onPropertiesChange?.(id, updatedBlock.properties);
                        }}
                    />
                );

            case BLOCK_TYPES.TABS:
                return (
                    <TabsBlock
                        block={block}
                        isActive={isActive}
                        onFocus={onFocus}
                        onKeyDown={onKeyDown}
                        onUpdate={(updatedBlock) => {
                            onPropertiesChange?.(id, updatedBlock.properties);
                        }}
                    />
                );

            case BLOCK_TYPES.IMAGE:
                return (
                    <ImageBlock
                        block={block}
                        isActive={isActive}
                        onFocus={onFocus}
                        onKeyDown={onKeyDown}
                        onUpdate={(updatedBlock) => {
                            onContentChange?.(id, updatedBlock.content);
                            onPropertiesChange?.(id, updatedBlock.properties);
                        }}
                    />
                );

            case BLOCK_TYPES.LINK:
                return (
                    <LinkBlock
                        block={block}
                        isActive={isActive}
                        onFocus={onFocus}
                        onKeyDown={onKeyDown}
                        onUpdate={(updatedBlock) => {
                            onContentChange?.(id, updatedBlock.content);
                            onPropertiesChange?.(id, updatedBlock.properties);
                        }}
                    />
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
