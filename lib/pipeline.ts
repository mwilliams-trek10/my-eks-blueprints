import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints'
import { Construct } from 'constructs';
import { TeamPlatform, TeamApplication} from '../teams/index';

export default class PipelineConstruct extends Construct {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);
    
    const account = props?.env?.account!;
    const region = props?.env?.region!;
    
    const teamPlatform = new TeamPlatform(account);
    const teamApplication = new TeamApplication('burnham', account);
    
    const autoscalerAddOn = new blueprints.ClusterAutoScalerAddOn();
    
    const blueprint = blueprints.EksBlueprint
                      .builder()
                      .account(account)
                      .region(region)
                      .addOns(autoscalerAddOn)
                      .teams(teamPlatform, teamApplication);
                      
    const pipeline = blueprints.CodePipelineStack.builder()
                        .name("eks-blueprints-workshop-pipeline")
                        .owner("mwilliams-trek10")
                        .repository({
                            repoUrl: "my-eks-blueprints",
                            credentialsSecretName: "github-token",
                            targetRevision: "main"
                        })
                        .wave({
                                id: "envs",
                                stages: [
                                    { id: "dev", stackBuilder: blueprint.clone('us-west-2') },
                                    { id: "test", stackBuilder: blueprint.clone('us-east-2') },
                                    { id: "prod", stackBuilder: blueprint.clone('us-east-1') },
                                    ]
                            })
                        .build(scope, id+"-stack", props);
    
  }
}
