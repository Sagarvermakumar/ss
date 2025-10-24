import { HStack, Box, Text,  } from "@chakra-ui/react";

import {keyframes} from '@emotion/react'

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const LiveStatus = ({ childId }) => {
  return (
    <HStack w="100%" justifyContent="space-between" alignItems="center">
      {/* Left side: User name */}
      <Text mb={2} fontSize="sm" color="gray.600">
        User: {childId}
      </Text>

      {/* Right side: Live dot + text */}
      <HStack spacing={1}>
        <Box
          w="10px"
          h="10px"
          borderRadius="full"
          bg="red.500"
          boxShadow="0 0 8px 3px rgba(255, 0, 0, 0.6)"
          animation={`${pulse} 1.5s infinite`}
        />
        <Text fontSize="xs" color="red.400" fontWeight="bold">
          LIVE
        </Text>
      </HStack>
    </HStack>
  );
};

export default LiveStatus;
