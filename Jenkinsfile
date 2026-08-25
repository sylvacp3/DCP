pipeline {
    agent any

    options {
        timestamps()
    }

    environment {
        BACKEND_IMAGE = 'sylvano123/dcp-backend'
        FRONTEND_IMAGE = 'sylvano123/dcp-frontend'
    }

    stages {
        stage('Verification du projet') {
            steps {
                sh 'pwd'
                sh 'git log -1 --oneline'
                sh 'test -f dcp-backend/Dockerfile'
                sh 'test -f dcp-frontend/Dockerfile'
            }
        }

        stage('Construction du backend') {
            steps {
                sh 'docker build -t "$BACKEND_IMAGE:ci-$BUILD_NUMBER" dcp-backend'
            }
        }

        stage('Construction du frontend') {
            steps {
                sh 'docker build -t "$FRONTEND_IMAGE:ci-$BUILD_NUMBER" dcp-frontend'
            }
        }

        stage('Verification des images') {
            steps {
                sh 'docker image inspect "$BACKEND_IMAGE:ci-$BUILD_NUMBER"'
                sh 'docker image inspect "$FRONTEND_IMAGE:ci-$BUILD_NUMBER"'
            }
        }

        stage('Publication Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-dcp',
                        usernameVariable: 'DOCKERHUB_USER',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    sh 'printf "%s" "$DOCKERHUB_TOKEN" | docker login --username "$DOCKERHUB_USER" --password-stdin'
                    sh 'docker push "$BACKEND_IMAGE:ci-$BUILD_NUMBER"'
                    sh 'docker push "$FRONTEND_IMAGE:ci-$BUILD_NUMBER"'
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout >/dev/null 2>&1 || true'
        }

        success {
            echo 'Les images DCP ont été construites et publiées avec succès.'
        }

        failure {
            echo 'Le pipeline a rencontré une erreur.'
        }
    }
}
