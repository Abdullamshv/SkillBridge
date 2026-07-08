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

export const GET_PROJECT = gql`
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

export const GET_SAVED_TASK_IDS = gql`
  query GetSavedTaskIds {
    savedTaskIds
  }
`;

export const GET_STUDENTS = gql`
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

export const GET_STUDENT = gql`
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
    }
  }
`;

export const GET_SAVED_STUDENT_IDS = gql`
  query GetSavedStudentIds {
    savedStudentIds
  }
`;
