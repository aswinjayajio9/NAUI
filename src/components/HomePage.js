import React, { useState } from "react";
import {
  ChakraProvider,
  Container,
  Heading,
  SimpleGrid,
  Box,
  Flex,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Select,
  Text,
} from "@chakra-ui/react";
import SheetComponent from "./SheetComponent";
import DashboardComponent from "./DashboardComponent";
// replaced NetworkDefinitionPage with DefinitionWizard
import DefinitionWizard from "./DefinitionWizard";

function NetworkAggHomePage() {
  const [firstSheetFilters, setFirstSheetFilters] = useState({});
  const [defineOpen, setDefineOpen] = useState(false);
  const [srcPlan, setSrcPlan] = useState("ERP");
  const [srcVersion, setSrcVersion] = useState("CWV");
  const [tgtPlan, setTgtPlan] = useState("MP");
  const [tgtVersion, setTgtVersion] = useState("CWV");
  const [currentPage, setCurrentPage] = useState("home"); // "home" | "networkDefinition"
  const [networkDefPayload, setNetworkDefPayload] = useState(null);

  const getFirstOptions = (colName) => {
    const opts = firstSheetFilters?.options || {};
    if (!opts || Object.keys(opts).length === 0) return [];
    const foundKey = Object.keys(opts).find(k => k.toLowerCase() === colName.toLowerCase());
    return foundKey ? opts[foundKey] : [];
  };

  if (currentPage === "networkDefinition" && networkDefPayload) {
    return (
      <ChakraProvider>
        <DefinitionWizard
          {...networkDefPayload}
          onBack={() => {
            setCurrentPage("home");
            setNetworkDefPayload(null);
          }}
        />
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      <Container maxW="100%" p={4}>
        <Heading mb={6} textAlign="center">
          Network Aggregator Dashboard
        </Heading>

        <SimpleGrid columns={1} spacing={6} mb={6}>
          <Box bg="white" p={4} borderRadius="lg" boxShadow="md">
            <DashboardComponent />
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={1} spacing={6}>
          <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
            <Flex justify="flex-end" mb={2}>
              <Button size="sm" onClick={() => setDefineOpen(true)}>Define New Network</Button>
            </Flex>
            {/* pass a callback so App can read filters from the first SheetComponent */}
            <SheetComponent dataUrl="http://127.0.0.1:8998/read/network_summary.csv" onFiltersChange={setFirstSheetFilters} />
          </Box>
          <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
            <SheetComponent dataUrl="http://127.0.0.1:8998/read/network_violations.csv" />
          </Box>
        </SimpleGrid>

        {/* Small modal that visually matches the pasted image 2 and uses filters from the first sheet */}
        <Modal isOpen={defineOpen} onClose={() => setDefineOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent maxW="560px" borderRadius="md" p={4}>
            <ModalHeader fontSize="lg">Network Model Creation</ModalHeader>
            <ModalBody>
              <FormControl mb={3}>
                <FormLabel fontSize="sm">Source Network</FormLabel>
                <Flex gap={3}>
                  <FormControl>
                    <FormLabel fontSize="xs">Plan Type</FormLabel>
                    <Select value={srcPlan} onChange={(e) => setSrcPlan(e.target.value)}>
                      {getFirstOptions("NETWORK").map(v => <option key={v}>{v}</option>)}
                      <option>Other</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs">Version</FormLabel>
                    <Select value={srcVersion} onChange={(e) => setSrcVersion(e.target.value)}>
                      {getFirstOptions("VERSION").map(v => <option key={v}>{v}</option>)}
                      <option>CurrentWorkingView</option>
                    </Select>
                  </FormControl>
                </Flex>
              </FormControl>

              <FormControl mb={3}>
                <FormLabel fontSize="sm">Target Network</FormLabel>
                <Flex gap={3}>
                  <FormControl>
                    <FormLabel fontSize="xs">Plan Type</FormLabel>
                    <Select value={tgtPlan} onChange={(e) => setTgtPlan(e.target.value)}>
                      {getFirstOptions("NETWORK").map(v => <option key={v}>{v}</option>)}
                      <option>Other</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs">Version</FormLabel>
                    <Select value={tgtVersion} onChange={(e) => setTgtVersion(e.target.value)}>
                      {getFirstOptions("VERSION").map(v => <option key={v}>{v}</option>)}
                      <option>CurrentWorkingView</option>
                    </Select>
                  </FormControl>
                </Flex>
              </FormControl>

              <Text fontSize="sm" color="gray.600" mt={2}>
                Filters from summary sheet: {firstSheetFilters?.activeFilters && Object.keys(firstSheetFilters.activeFilters).length ? JSON.stringify(firstSheetFilters.activeFilters) : "none"}
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" mr={3} onClick={() => setDefineOpen(false)}>Cancel</Button>
              <Button colorScheme="blue" onClick={() => {
                // action: create network (placeholder)
                console.log({ srcPlan, srcVersion, tgtPlan, tgtVersion, filters: firstSheetFilters });
                setDefineOpen(false);
                setNetworkDefPayload({ srcPlan, srcVersion, tgtPlan, tgtVersion, filters: firstSheetFilters });
                setCurrentPage("networkDefinition");
              }}>Create</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

      </Container>
    </ChakraProvider>
  );
}

export default NetworkAggHomePage;
