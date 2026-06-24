import { gql } from "@apollo/client";

export const GET_ME = gql`
  query GetMe {
    me {
      id
      username
      email
      role
      isVerified
      avatar
      createdAt
    }
  }
`;

export const GET_PROJECTS = gql`
  query GetProjects($status: String, $category: String) {
    projects(status: $status, category: $category) {
      id
      title
      description
      category
      budget
      deadline
      status
      createdAt
      sme {
        id
        companyName
        industry
        rating
      }
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      title
      description
      category
      budget
      deadline
      status
      createdAt
      sme {
        id
        companyName
        industry
        website
        rating
        user {
          username
          avatar
        }
      }
      assignedStudent {
        id
        university
        major
        rating
        user {
          username
          avatar
        }
      }
    }
  }
`;

export const GET_MY_PROJECTS = gql`
  query GetMyProjects {
    myProjects {
      id
      title
      category
      budget
      deadline
      status
      createdAt
    }
  }
`;

export const GET_MY_PROPOSALS = gql`
  query GetMyProposals {
    myProposals {
      id
      proposedBudget
      proposedDays
      status
      createdAt
      project {
        id
        title
        category
        deadline
        sme {
          companyName
        }
      }
    }
  }
`;
