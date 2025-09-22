import React from "react";
import { Flex, Box, Text, Button } from "@chakra-ui/react";

export default function NavigateDefinition({
  steps = [
    "Material Definition",
    "Resource Definition",
    "Parameters Definition",
    "Preview Network",
  ],
  initialStep = 0,
  current,      // optional controlled prop (number)
  onChange,     // optional controlled setter (fn(newIndex))
  onStepChange, // callback when step changes
  onFinish,
  showControls = true, // when false the Prev/Next buttons are not rendered here
 }) {
  const [internal, setInternal] = React.useState(initialStep);

  // keep internal in sync if initialStep changes
  React.useEffect(() => {
    setInternal(initialStep);
  }, [initialStep]);

  const currentIndex = typeof current === "number" ? current : internal;

  React.useEffect(() => {
    onStepChange?.(currentIndex);
  }, [currentIndex, onStepChange]);

  const setIndex = (next) => {
    if (typeof onChange === "function") onChange(next);
    else setInternal(next);
  };

  const goPrev = () => setIndex((s) => Math.max(0, (typeof current === "number" ? current : internal) - 1));
  const goNext = () => {
    const idx = typeof current === "number" ? current : internal;
    if (idx < steps.length - 1) setIndex(idx + 1);
    else onFinish?.();
  };

  return (
    // compact horizontal step bar
    <Flex mb={4} align="center" maxW="100%" w="100%" px={2}>
      {/* steps container: allow horizontal scrolling on small/zoomed screens */}
      <Box flex="1" minW={0} overflowX="auto" px={2}
        sx={{
          "::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        <Flex gap={8} align="center" wrap="nowrap" display="inline-flex" minH="40px">
          {steps.map((s, i) => {
            const circleBg = i < currentIndex ? "green.500" : i === currentIndex ? "blue.500" : "gray.200";
            const circleColor = i < currentIndex || i === currentIndex ? "white" : "black";
            const labelColor = i <= currentIndex ? "gray.700" : "gray.500";
            const connectorBg = i < currentIndex ? "green.200" : "gray.200";

            return (
              <Flex
                key={s}
                align="center"
                gap={3}
                cursor="pointer"
                onClick={() => setIndex(i)}
                userSelect="none"
                flexShrink={0} /* prevent items from shrinking when space is tight */
              >
                <Box
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  bg={circleBg}
                  color={circleColor}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="sm"
                  boxShadow={i === currentIndex ? "sm" : "none"}
                  transition="all 120ms"
                >
                  {i + 1}
                </Box>

                <Text fontSize="sm" color={labelColor} whiteSpace="nowrap" fontWeight={i === currentIndex ? "600" : "500"}>
                  {s}
                </Text>

                {i < steps.length - 1 && (
                  <Box
                    w="56px"
                    h="1px"
                    bg={connectorBg}
                    borderRadius="full"
                    ml={1}
                    mr={1}
                  />
                )}
              </Flex>
            );
          })}
        </Flex>
      </Box>

      {/* fixed controls on the right so they remain visible */}
      {showControls && (
        <Flex gap={2} ml={4} flexShrink={0} align="center">
          <Button size="sm" variant="outline" onClick={goPrev} isDisabled={currentIndex === 0}>
            Previous
          </Button>
          <Button size="sm" colorScheme="blue" onClick={goNext}>
            {currentIndex === steps.length - 1 ? "Finish" : "Next"}
          </Button>
        </Flex>
      )}
    </Flex>
  );
}