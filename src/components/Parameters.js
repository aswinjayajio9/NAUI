import React from "react";
import {
  Box,
  Flex,
  Button,
  Heading,
  SimpleGrid,
  Text,
  Stack,
} from "@chakra-ui/react";
// NavigateDefinition removed from this page (parent will render it)
import SheetComponent from "./SheetComponent";
import NetworkGraph from "./NetworkGraph";

/*
  ResourceDefinitionPage
  - Clean page: parent provides step control.
*/

export default function ResourceDefinitionPage({
  srcPlan,
  srcVersion,
  tgtPlan,
  tgtVersion,
  filters,
  onBack,
  onNext,    // injected by DefinitionWizard
  onPrev,    // injected by DefinitionWizard
  isFirst,   // injected by DefinitionWizard
  isLast,    // injected by DefinitionWizard
}) {

  const [detailsView, setDetailsView] = React.useState("table"); // "table" or "network"

  return (
    <Box p={6}>
      <Flex mb={4} justify="space-between" align="center">
        <Flex gap={3} align="center">
          <Button size="sm" onClick={onBack}>Back</Button>
          <Heading size="md">Resource Definition</Heading>
        </Flex>
        <Stack spacing={0} align="flex-end">
          <Text fontSize="sm" color="gray.600">Source: {srcPlan} / {srcVersion}</Text>
          <Text fontSize="sm" color="gray.600">Target: {tgtPlan} / {tgtVersion}</Text>
        </Stack>
      </Flex>

      {/* Resource Definition - Rules Section */}
      <Box w="100%" mb={6}>
        <Heading size="sm" mb={3}>
            Parameters
        </Heading>
        <SimpleGrid columns={1} spacing={6}>
            <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
                <SheetComponent dataUrl="http://127.0.0.1:8998/read/parameters.csv" />
            </Box>
        </SimpleGrid>
      </Box>
      {/* Consolidating Non-Similar/Simultaneous Resources */}
      <Box w="100%" mb={6}>
        <Heading size="sm" mb={3}>
            Consolidating Non-Similar/Simultaneous Resources
        </Heading>
        <SimpleGrid columns={1} spacing={6}>
            <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
                <SheetComponent dataUrl="http://127.0.0.1:8998/read/parameter_definition.csv" />
            </Box>
        </SimpleGrid>
      </Box>

      {/* Page-level navigation (restores Next/Previous buttons on the page) */}
      <Flex mt={4} gap={2} justify="flex-end">
        <Button size="sm" onClick={onPrev} isDisabled={isFirst}>
          Previous
        </Button>
        <Button size="sm" colorScheme="blue" onClick={onNext}>
          {isLast ? "Finish" : "Next"}
        </Button>
      </Flex>
    </Box>
  );
}