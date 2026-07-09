import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  EngagementsData,
  MeData,
  NoVars,
  ProjectData,
  ProjectsData,
  ProjectsVars,
  ProjectVars,
  SavedStudentIdsData,
  SavedTaskIdsData,
  StudentData,
  StudentsData,
  StudentsVars,
  StudentVars,
  WalletStatsData,
} from "./types";

export const GET_ME: TypedDocumentNode<MeData, NoVars> = gql`
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

export const GET_PROJECTS: TypedDocumentNode<ProjectsData, ProjectsVars> = gql`
  query GetProjects(
    $search: String
    $category: String
    $minPrice: String
    $maxPrice: String
    $sort: String
  ) {
    projects(
      search: $search
      category: $category
      minPrice: $minPrice
      maxPrice: $maxPrice
      sort: $sort
    ) {
      id
      title
      category
      budget
      deadline
      createdAt
      requiredSkills
      sme {
        id
        companyName
        location
        isVerified
      }
    }
  }
`;

export const GET_PROJECT: TypedDocumentNode<ProjectData, ProjectVars> = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      title
      description
      descriptionExtra
      category
      budget
      platformFee
      businessTotal
      deadline
      status
      requiredSkills
      lookingForBullets
      milestones {
        id
        label
        note
        dueDate
      }
      sme {
        id
        companyName
        location
        website
        isVerified
        rating
        ratingCount
        user {
          id
          username
          avatar
        }
      }
      assignedStudent {
        id
        university
        rating
        user {
          username
          avatar
        }
      }
    }
  }
`;

export const GET_SAVED_TASK_IDS: TypedDocumentNode<SavedTaskIdsData, NoVars> = gql`
  query GetSavedTaskIds {
    savedTaskIds
  }
`;

export const GET_STUDENTS: TypedDocumentNode<StudentsData, StudentsVars> = gql`
  query GetStudents(
    $search: String
    $category: String
    $minPrice: String
    $maxPrice: String
    $minRating: Float
  ) {
    students(
      search: $search
      category: $category
      minPrice: $minPrice
      maxPrice: $maxPrice
      minRating: $minRating
    ) {
      id
      university
      major
      primaryCategory
      skills
      priceLow
      priceHigh
      availabilityStatus
      availableFrom
      rating
      ratingCount
      isVetted
      user {
        id
        username
        avatar
      }
    }
  }
`;

export const GET_STUDENT: TypedDocumentNode<StudentData, StudentVars> = gql`
  query GetStudent($id: ID!) {
    student(id: $id) {
      id
      university
      major
      graduationYear
      primaryCategory
      skills
      bio
      portfolioUrl
      languages
      priceLow
      priceHigh
      availabilityStatus
      availableFrom
      rating
      ratingCount
      isVetted
      user {
        id
        username
        avatar
      }
      reviews {
        id
        rating
        comment
        createdAt
        reviewer {
          username
        }
      }
    }
  }
`;

export const GET_SAVED_STUDENT_IDS: TypedDocumentNode<SavedStudentIdsData, NoVars> = gql`
  query GetSavedStudentIds {
    savedStudentIds
  }
`;

export const GET_ENGAGEMENTS: TypedDocumentNode<EngagementsData, NoVars> = gql`
  query GetEngagements {
    engagements {
      id
      status
      agreedPrice
      updatedAt
      project {
        id
        title
        budget
      }
      sme {
        id
        companyName
        user {
          id
          username
        }
      }
      student {
        id
        user {
          id
          username
        }
      }
      messages {
        id
        text
        createdAt
        sender {
          id
          username
        }
        attachments {
          id
          originalName
          sizeBytes
          url
        }
      }
      transaction {
        id
        status
        amount
        platformFee
      }
      reviewerUsernames
    }
  }
`;

export const GET_WALLET_STATS: TypedDocumentNode<WalletStatsData, NoVars> = gql`
  query GetWalletStats {
    walletStats {
      thisMonthTotal
      escrowHeld
      activeTotal
      activeCount
      feesThisMonth
      months {
        label
        value
      }
    }
  }
`;
