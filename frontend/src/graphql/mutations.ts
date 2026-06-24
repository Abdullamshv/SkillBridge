import { gql } from "@apollo/client";

export const REGISTER = gql`
  mutation Register(
    $username: String!
    $email: String!
    $password: String!
    $role: String!
  ) {
    register(
      username: $username
      email: $email
      password: $password
      role: $role
    ) {
      id
      username
      email
      role
      isVerified
    }
  }
`;

export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      id
      username
      email
      role
      isVerified
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject(
    $title: String!
    $description: String!
    $category: String!
    $budget: String!
    $deadline: Date!
  ) {
    createProject(
      title: $title
      description: $description
      category: $category
      budget: $budget
      deadline: $deadline
    ) {
      id
      title
      status
      budget
      deadline
    }
  }
`;

export const SUBMIT_PROPOSAL = gql`
  mutation SubmitProposal(
    $projectId: ID!
    $coverLetter: String!
    $proposedBudget: String!
    $proposedDays: Int!
  ) {
    submitProposal(
      projectId: $projectId
      coverLetter: $coverLetter
      proposedBudget: $proposedBudget
      proposedDays: $proposedDays
    ) {
      id
      status
      proposedBudget
      proposedDays
    }
  }
`;

export const ACCEPT_PROPOSAL = gql`
  mutation AcceptProposal($proposalId: ID!) {
    acceptProposal(proposalId: $proposalId) {
      id
      status
      project {
        id
        status
      }
    }
  }
`;

export const UPDATE_STUDENT_PROFILE = gql`
  mutation UpdateStudentProfile(
    $university: String
    $major: String
    $graduationYear: Int
    $skills: [String!]
    $bio: String
    $portfolioUrl: String
  ) {
    updateStudentProfile(
      university: $university
      major: $major
      graduationYear: $graduationYear
      skills: $skills
      bio: $bio
      portfolioUrl: $portfolioUrl
    ) {
      id
      university
      major
      skills
      rating
    }
  }
`;

export const UPDATE_SME_PROFILE = gql`
  mutation UpdateSmeProfile(
    $companyName: String
    $industry: String
    $website: String
    $description: String
  ) {
    updateSmeProfile(
      companyName: $companyName
      industry: $industry
      website: $website
      description: $description
    ) {
      id
      companyName
      industry
      website
    }
  }
`;
