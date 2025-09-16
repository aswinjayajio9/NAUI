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
import StatusCard from "./StatusCard";

/*
  ResourceDefinitionPage
  - Clean page: parent provides step control.
*/

export default function PreviewPage({
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
            Scope Definintions
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
                <SheetComponent dataUrl="http://127.0.0.1:8998/read/scope_definition.csv" />
            </Box>
            
                <StatusCard
        title="Network Status"
        dataUrl="http://127.0.0.1:8998/read/status_summary.csv"
      />

        </SimpleGrid>
      </Box>
      <Box w="100%" mb={6}>
              <Heading size="sm" mb={3}>
                  Preview of Resource Definition
              </Heading>
      
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
                  <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
                  <SheetComponent dataUrl="http://127.0.0.1:8998/read/summary_resource1.csv" />
                  </Box>
                  <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
                  <SheetComponent dataUrl="http://127.0.0.1:8998/read/summary_resource2.csv" />
                  </Box>
              </SimpleGrid>
            </Box>
      <Box w="100%" mb={6}>
        <Heading size="sm" mb={3}>
                  Preview of Material Definition
        </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
                <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
                <SheetComponent dataUrl="http://127.0.0.1:8998/read/summary_definition1.csv" />
                </Box>
                <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
                <SheetComponent dataUrl="http://127.0.0.1:8998/read/summary_definition2.csv" />
                </Box>
            </SimpleGrid>
      </Box>
      <Box w="100%" mb={6}>
        <Heading size="sm" mb={3}>
                  Preview of Material Definition
        </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
                <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
                <NetworkGraph dataUrl="http://127.0.0.1:8998/read/material_definition_details.csv" />
                </Box>
                <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
                <NetworkGraph dataUrl="http://127.0.0.1:8998/read/target_resource_details.csv" />
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